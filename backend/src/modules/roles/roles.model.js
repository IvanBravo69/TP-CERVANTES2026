const { pool } = require('../../config/db');

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, nombre, activo FROM roles ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.nombre, r.activo,
            JSON_ARRAYAGG(
              JSON_OBJECT('id', p.id, 'nombre', p.nombre)
            ) AS permisos
     FROM roles r
     LEFT JOIN roles_permisos rp ON rp.role_id = r.id
     LEFT JOIN permisos p ON p.id = rp.permiso_id
     WHERE r.id = ?
     GROUP BY r.id`,
    [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  row.permisos = row.permisos ? JSON.parse(row.permisos).filter(Boolean) : [];
  return row;
}

module.exports = { findAll, findById };
