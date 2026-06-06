const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'sistema_britos',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'local',
});

async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✔  MySQL conectado — base:', process.env.DB_NAME);
  conn.release();
}

module.exports = { pool, testConnection };
