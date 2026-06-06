const { pool } = require('../../config/db');

async function findAll() {
  const [rows] = await pool.execute('SELECT id, nombre FROM permisos ORDER BY nombre');
  return rows;
}

module.exports = { findAll };
