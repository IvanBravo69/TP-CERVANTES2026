const { pool } = require('../../config/db');

async function findByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.password, u.full_name, u.email, u.activo,
            r.id AS role_id, r.nombre AS role_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = ?
     LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function getPermisosByRoleId(roleId) {
  const [rows] = await pool.execute(
    `SELECT p.nombre
     FROM permisos p
     JOIN roles_permisos rp ON rp.permiso_id = p.id
     WHERE rp.role_id = ?`,
    [roleId]
  );
  return rows.map((r) => r.nombre);
}

module.exports = { findByUsername, getPermisosByRoleId };
