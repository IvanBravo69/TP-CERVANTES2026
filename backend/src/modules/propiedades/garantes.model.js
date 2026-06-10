const { pool } = require('../../config/db');

async function findByPropiedadId(propiedad_id) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.nombre, g.apellido, g.dni_cuit, g.telefono, g.email, g.direccion, g.observaciones
     FROM garantes g
     JOIN propiedad_garantes pg ON pg.garante_id = g.id
     WHERE pg.propiedad_id = ?
     ORDER BY g.id`,
    [propiedad_id]
  );
  return rows;
}

async function isLinked(propiedad_id, garante_id) {
  const [[{ n }]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM propiedad_garantes WHERE propiedad_id = ? AND garante_id = ?',
    [propiedad_id, garante_id]
  );
  return n > 0;
}

async function link(propiedad_id, garante_id) {
  await pool.execute(
    'INSERT INTO propiedad_garantes (propiedad_id, garante_id) VALUES (?, ?)',
    [propiedad_id, garante_id]
  );
}

async function unlink(propiedad_id, garante_id) {
  const [result] = await pool.execute(
    'DELETE FROM propiedad_garantes WHERE propiedad_id = ? AND garante_id = ?',
    [propiedad_id, garante_id]
  );
  return result.affectedRows > 0;
}

module.exports = { findByPropiedadId, isLinked, link, unlink };
