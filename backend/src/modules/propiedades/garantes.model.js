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

async function countByPropiedadId(propiedad_id) {
  const [[{ n }]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM propiedad_garantes WHERE propiedad_id = ?',
    [propiedad_id]
  );
  return n;
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

// ── Adjuntos ──────────────────────────────────────────────────────────────

async function listAdjuntos(garante_id) {
  const [rows] = await pool.execute(
    'SELECT tipo, nombre, mime_type, created_at FROM garante_adjuntos WHERE garante_id = ?',
    [garante_id]
  );
  return rows;
}

async function getAdjunto(garante_id, tipo) {
  const [rows] = await pool.execute(
    'SELECT tipo, nombre, mime_type, data FROM garante_adjuntos WHERE garante_id = ? AND tipo = ? LIMIT 1',
    [garante_id, tipo]
  );
  return rows[0] || null;
}

async function saveAdjunto(garante_id, tipo, nombre, mime_type, data) {
  await pool.execute(
    `INSERT INTO garante_adjuntos (garante_id, tipo, nombre, mime_type, data)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), mime_type = VALUES(mime_type), data = VALUES(data)`,
    [garante_id, tipo, nombre || null, mime_type || null, data]
  );
  return listAdjuntos(garante_id);
}

async function deleteAdjunto(garante_id, tipo) {
  const [result] = await pool.execute(
    'DELETE FROM garante_adjuntos WHERE garante_id = ? AND tipo = ?',
    [garante_id, tipo]
  );
  return result.affectedRows > 0;
}

module.exports = { findByPropiedadId, countByPropiedadId, isLinked, link, unlink, listAdjuntos, getAdjunto, saveAdjunto, deleteAdjunto };
