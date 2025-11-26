// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'sua_chave_secreta_super_segura'; // Em produção, use .env

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Limite aumentado para imagens base64

// ==================================================================
//                       AUTENTICAÇÃO & CONTA
// ==================================================================

// --- ROTA DE CADASTRO ---
app.post('/api/auth/signup', async (req, res) => {
  const { nome, email, password, tipoConta, nomeNegocio, telefone, endereco } = req.body;

  try {
    // 1. Verificar se email já existe
    const userCheck = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    // 2. Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const hashSenha = await bcrypt.hash(password, salt);

    // 3. Inserir usuário
    const newUser = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, nome_negocio, telefone) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, tipo_usuario`,
      [nome, email, hashSenha, tipoConta, nomeNegocio || null, telefone || null]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso!', user: newUser.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor ao cadastrar.' });
  }
});

// --- ROTA DE LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuário
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Usuário não encontrado.' });

    const user = result.rows[0];

    // 2. Comparar senha
    const validPass = await bcrypt.compare(password, user.senha_hash);
    if (!validPass) return res.status(400).json({ error: 'Senha incorreta.' });

    // 3. Gerar Token
    const token = jwt.sign({ id: user.id, type: user.tipo_usuario }, SECRET_KEY, { expiresIn: '7d' });

    // 4. Retornar dados (sem a senha)
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipoConta: user.tipo_usuario,
        nomeNegocio: user.nome_negocio,
        telefone: user.telefone
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login.' });
  }
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) return res.status(403).json({ error: 'Token não fornecido.' });
  const token = tokenHeader.split(' ')[1]; // Remove o "Bearer "

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido.' });
    req.userId = decoded.id;
    next();
  });
};

// --- ROTA: PEGAR DADOS DO USUÁRIO LOGADO + FAVORITOS ---
app.get('/api/users/me', verifyToken, async (req, res) => {
  try {
    // Buscar dados do usuário
    const userRes = await pool.query('SELECT id, nome, email, tipo_usuario as "tipoConta", nome_negocio as "nomeNegocio", telefone, endereco, foto_perfil as "fotoPerfil" FROM usuarios WHERE id = $1', [req.userId]);
    const user = userRes.rows[0];

    // Buscar IDs dos favoritos
    const favRes = await pool.query('SELECT evento_id FROM favoritos WHERE usuario_id = $1', [req.userId]);
    const favoritos = favRes.rows.map(row => row.evento_id);

    // Buscar Eventos Confirmados (Se tiver tabela, senao vazio)
    const confirmados = []; 

    res.json({ user: { ...user, favoritos, eventosConfirmados: confirmados } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

// --- ROTA: TOGGLE FAVORITO ---
app.post('/api/users/favorites', verifyToken, async (req, res) => {
  const { eventId } = req.body;
  try {
    const check = await pool.query('SELECT * FROM favoritos WHERE usuario_id = $1 AND evento_id = $2', [req.userId, eventId]);
    
    if (check.rows.length > 0) {
      // Remove
      await pool.query('DELETE FROM favoritos WHERE usuario_id = $1 AND evento_id = $2', [req.userId, eventId]);
      res.json({ status: 'removed' });
    } else {
      // Adiciona
      await pool.query('INSERT INTO favoritos (usuario_id, evento_id) VALUES ($1, $2)', [req.userId, eventId]);
      res.json({ status: 'added' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar favoritos' });
  }
});

// --- ROTA: ATUALIZAR PERFIL (PUT) ---
app.put('/api/users/me', verifyToken, async (req, res) => {
  const { nome, nomeNegocio, telefone, endereco, fotoPerfil } = req.body;
  
  try {
    await pool.query(
      `UPDATE usuarios 
       SET nome = COALESCE($1, nome),
           nome_negocio = COALESCE($2, nome_negocio),
           telefone = COALESCE($3, telefone),
           endereco = COALESCE($4, endereco),
           foto_perfil = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE foto_perfil END
       WHERE id = $6`,
      [nome, nomeNegocio, telefone, endereco, fotoPerfil, req.userId]
    );

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// --- ROTA: ALTERAR SENHA ---
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  try {
    // 1. Busca a senha atual
    const userRes = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.userId]);
    const user = userRes.rows[0];

    // 2. Compara
    const validPass = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!validPass) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    // 3. Gera nova senha
    const salt = await bcrypt.genSalt(10);
    const novoHash = await bcrypt.hash(novaSenha, salt);

    // 4. Salva
    await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novoHash, req.userId]);

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// --- ROTA: RESETAR SENHA (SIMULADA) ---
app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  
  const userCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
  if (userCheck.rows.length === 0) {
    return res.status(404).json({ error: 'E-mail não encontrado.' });
  }

  console.log(`[SIMULAÇÃO] E-mail de reset enviado para: ${email}`);
  res.json({ message: 'Link de redefinição enviado.' });
});

// ==================================================================
//               ROTAS DE EVENTOS E USUÁRIOS PÚBLICOS
// ==================================================================

// --- GET /api/users/:id (Dados públicos do lojista) ---
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, nome, nome_negocio, telefone, endereco, foto_perfil, tipo_usuario FROM usuarios WHERE id = $1', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const u = result.rows[0];
    const userData = {
      id: u.id,
      nome: u.nome,
      nomeNegocio: u.nome_negocio,
      telefone: u.telefone,
      endereco: u.endereco,
      fotoPerfil: u.foto_perfil,
      tipoConta: u.tipo_usuario
    };

    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

// --- GET /api/eventos (Todos ou filtrados por lojistaId) ---
app.get('/api/eventos', async (req, res) => {
  const { lojistaId } = req.query;
  
  try {
    let queryText = 'SELECT * FROM eventos';
    let queryParams = [];

    if (lojistaId) {
      queryText += ' WHERE lojista_id = $1';
      queryParams.push(lojistaId);
    }
    
    queryText += ' ORDER BY criado_em DESC';

    const result = await pool.query(queryText, queryParams);
    
    // Formatar snake_case -> camelCase
    const eventosFormatados = result.rows.map(row => ({
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        categoria: row.categoria,
        dataInicio: row.data_inicio,
        horaInicio: row.hora_inicio,
        dataFim: row.data_fim,
        horaFim: row.hora_fim,
        endereco: row.endereco,
        imageUrl: row.image_url,
        lojistaId: row.lojista_id
    }));

    res.json(eventosFormatados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar eventos.' });
  }
});

// --- GET /api/eventos/:id (Detalhes de um evento) ---
app.get('/api/eventos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const row = result.rows[0];
    const eventoFormatado = {
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        categoria: row.categoria,
        dataInicio: row.data_inicio,
        horaInicio: row.hora_inicio,
        dataFim: row.data_fim,
        horaFim: row.hora_fim,
        endereco: row.endereco,
        imageUrl: row.image_url,
        lojistaId: row.lojista_id
    };

    res.json(eventoFormatado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar evento.' });
  }
});

// --- POST /api/eventos (Criar evento) - Protegido ---
app.post('/api/eventos', verifyToken, async (req, res) => {
  const { 
    titulo, categoria, descricao, 
    dataInicio, horaInicio, dataFim, horaFim, 
    endereco, imageUrl 
  } = req.body;

  try {
    const newEvent = await pool.query(
      `INSERT INTO eventos 
       (titulo, categoria, descricao, data_inicio, hora_inicio, data_fim, hora_fim, endereco, image_url, lojista_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [titulo, categoria, descricao, dataInicio, horaInicio, dataFim, horaFim, endereco, imageUrl, req.userId]
    );

    res.status(201).json({ message: 'Evento criado!', id: newEvent.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar evento.' });
  }
});

// --- PUT /api/eventos/:id (Editar evento) - Protegido ---
app.put('/api/eventos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { 
    titulo, categoria, descricao, 
    dataInicio, horaInicio, dataFim, horaFim, 
    endereco, imageUrl 
  } = req.body;

  try {
    // Verifica se o evento pertence ao usuário logado
    const checkOwner = await pool.query('SELECT lojista_id FROM eventos WHERE id = $1', [id]);
    
    if (checkOwner.rows.length === 0) return res.status(404).json({ error: 'Evento não encontrado' });
    if (checkOwner.rows[0].lojista_id !== req.userId) return res.status(403).json({ error: 'Permissão negada.' });

    await pool.query(
      `UPDATE eventos 
       SET titulo=$1, categoria=$2, descricao=$3, 
           data_inicio=$4, hora_inicio=$5, data_fim=$6, hora_fim=$7, 
           endereco=$8, image_url=$9
       WHERE id=$10`,
      [titulo, categoria, descricao, dataInicio, horaInicio, dataFim, horaFim, endereco, imageUrl, id]
    );

    res.json({ message: 'Evento atualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
});

// --- EXCLUIR EVENTO (DELETE /api/eventos/:id) - PROTEGIDO ---
app.delete('/api/eventos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Verifica se o evento existe
    const checkOwner = await pool.query('SELECT lojista_id FROM eventos WHERE id = $1', [id]);
    
    if (checkOwner.rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // 2. Verifica se o usuário logado (req.userId) é o dono do evento
    // ATENÇÃO: O banco retorna inteiro, o token pode ser string/int. É bom garantir a comparação frouxa (==) ou converter.
    if (checkOwner.rows[0].lojista_id !== req.userId) {
      return res.status(403).json({ error: 'Permissão negada. Você não é o dono deste evento.' });
    }

    // 3. Remove dependências (favoritos)
    await pool.query('DELETE FROM favoritos WHERE evento_id = $1', [id]);

    // 4. Remove o evento
    await pool.query('DELETE FROM eventos WHERE id = $1', [id]);

    res.json({ message: 'Evento excluído.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao excluir evento.' });
  }
});

// ==================================================================

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
