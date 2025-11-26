// backend/server_mvc.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./db'); 

const app = express();
const PORT = 3001; 

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'segredo_mvc_parte1',
    resave: false,
    saveUninitialized: true
}));

// --- MIDDLEWARES ---
const requireLogin = (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    next();
};

const requireLojista = (req, res, next) => {
    if (req.session.user && req.session.user.tipo_usuario === 'lojista') {
        next();
    } else {
        res.send("<h1>Acesso Negado</h1><p>Apenas Lojistas podem gerenciar eventos.</p><a href='/dashboard'>Voltar</a>");
    }
};

// --- ROTAS ---

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { erro: null }));

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.senha_hash);
            if (valid) {
                req.session.user = user;
                await pool.query('INSERT INTO logs_sistema (acao, usuario_id) VALUES ($1, $2)', 
                    ['Login realizado', user.id]);
                return res.redirect('/dashboard');
            }
        }
        res.render('login', { erro: 'Dados inválidos' });
    } catch (e) {
        res.send("Erro: " + e.message);
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/dashboard', requireLogin, async (req, res) => {
    let query = 'SELECT * FROM eventos';
    let params = [];
    
    // Se for lojista, vê só os seus. Se for consumidor, vê todos.
    if (req.session.user.tipo_usuario === 'lojista') {
        query += ' WHERE lojista_id = $1';
        params.push(req.session.user.id);
    }
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    
    // --- CORREÇÃO AQUI: Definir logs antes de renderizar ---
    let logs = [];
    
    // Se for lojista, busca os logs no banco
    if (req.session.user.tipo_usuario === 'lojista') {
        try {
            const logsRes = await pool.query('SELECT * FROM logs_sistema WHERE usuario_id = $1 ORDER BY id DESC LIMIT 5', [req.session.user.id]);
            logs = logsRes.rows;
        } catch (e) {
            console.error("Erro ao buscar logs:", e);
        }
    }

    // Envia 'logs' para a tela, mesmo que esteja vazio
    res.render('lista', { 
        eventos: result.rows, 
        user: req.session.user,
        logs: logs 
    });
});

// --- CRUD EVENTOS ---

app.get('/evento/novo', requireLogin, requireLojista, async (req, res) => {
    const catResult = await pool.query('SELECT * FROM categorias');
    // Passamos um objeto vazio com as chaves para não dar erro no EJS
    const eventoVazio = { 
        id: '', titulo: '', descricao: '', categoria: '', 
        data_inicio: '', hora_inicio: '', data_fim: '', hora_fim: '', 
        endereco: '', image_url: '' 
    };
    res.render('form', { evento: eventoVazio, categorias: catResult.rows });
});

app.get('/evento/editar/:id', requireLogin, requireLojista, async (req, res) => {
    const eventoRes = await pool.query('SELECT * FROM eventos WHERE id = $1 AND lojista_id = $2', 
        [req.params.id, req.session.user.id]);
    
    if (eventoRes.rows.length === 0) return res.send("Evento não encontrado ou sem permissão.");

    const catResult = await pool.query('SELECT * FROM categorias');
    res.render('form', { evento: eventoRes.rows[0], categorias: catResult.rows });
});

// ROTA DE SALVAR ATUALIZADA (TODOS OS CAMPOS)
app.post('/evento/salvar', requireLogin, requireLojista, async (req, res) => {
    const { 
        id, titulo, descricao, categoria, 
        dataInicio, horaInicio, dataFim, horaFim, 
        endereco, imageUrl 
    } = req.body;
    
    try {
        if (id) {
            // UPDATE
            await pool.query(
                `UPDATE eventos 
                 SET titulo=$1, descricao=$2, categoria=$3, 
                     data_inicio=$4, hora_inicio=$5, data_fim=$6, hora_fim=$7, 
                     endereco=$8, image_url=$9 
                 WHERE id=$10 AND lojista_id=$11`,
                [titulo, descricao, categoria, dataInicio, horaInicio, dataFim, horaFim, endereco, imageUrl, id, req.session.user.id]
            );
            await pool.query('INSERT INTO logs_sistema (acao, usuario_id) VALUES ($1, $2)', 
                [`Editou evento: ${titulo}`, req.session.user.id]);
        } else {
            // CREATE
            await pool.query(
                `INSERT INTO eventos 
                 (titulo, descricao, categoria, data_inicio, hora_inicio, data_fim, hora_fim, endereco, image_url, lojista_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [titulo, descricao, categoria, dataInicio, horaInicio, dataFim, horaFim, endereco, imageUrl, req.session.user.id]
            );
            await pool.query('INSERT INTO logs_sistema (acao, usuario_id) VALUES ($1, $2)', 
                [`Criou evento: ${titulo}`, req.session.user.id]);
        }
        res.redirect('/dashboard');
    } catch (e) {
        res.send("Erro ao salvar: " + e.message);
    }
});

app.get('/evento/deletar/:id', requireLogin, requireLojista, async (req, res) => {
    try {
        const check = await pool.query('SELECT id FROM eventos WHERE id = $1 AND lojista_id = $2', [req.params.id, req.session.user.id]);
        if (check.rows.length === 0) return res.send("Permissão negada.");

        await pool.query('DELETE FROM favoritos WHERE evento_id = $1', [req.params.id]);
        await pool.query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
        
        await pool.query('INSERT INTO logs_sistema (acao, usuario_id) VALUES ($1, $2)', 
            [`Deletou evento ID: ${req.params.id}`, req.session.user.id]);

        res.redirect('/dashboard');
    } catch (e) {
        res.send("Erro ao deletar: " + e.message);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor MVC (Parte 1) rodando em http://localhost:${PORT}/login`);
});