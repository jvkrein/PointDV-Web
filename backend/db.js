// backend/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // Usuário do Postgres 
  host: 'localhost',
  database: 'pointdv_db',  // Nome do banco 
  password: 'admin',       // Senha do Postgres
  port: 5432,
});

module.exports = pool;

