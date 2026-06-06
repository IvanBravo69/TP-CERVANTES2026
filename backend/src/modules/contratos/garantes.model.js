const { pool } = require('../../config/db');

async function findByContratoId(contrato_id) {
  const [rows] = await pool.execute(
    `SELECT g.id, g.nombre, g.apellido, g.dni_cuit, g.telefono, g.email, g.direccion, g.observaciones
     FROM garantes g
     JOIN contrato_garantes cg ON cg.garante_id = g.id
     WHERE cg.contrato_id = ?
     ORDER BY g.id`,
    [contrato_id]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, apellido, dni_cuit, telefono, email, direccion, observaciones, created_at, updated_at FROM garantes WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByDni(dni_cuit) {
  const [rows] = await pool.execute(
    'SELECT id, nombre, apellido, dni_cuit, telefono, email, direccion, observaciones FROM garantes WHERE dni_cuit = ? LIMIT 1',
    [dni_cuit]
  );
  return rows[0] || null;
}

async function create({ nombre, apellido, dni_cuit, telefono, email, direccion, observaciones }) {
  const [result] = await pool.execute(
    `INSERT INTO garantes (nombre, apellido, dni_cuit, telefono, email, direccion, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido || null, dni_cuit || null, telefono || null, email || null, direccion || null, observaciones || null]
  );
  return findById(result.insertId);
}

async function isLinked(contrato_id, garante_id) {
  const [[{ n }]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM contrato_garantes WHERE contrato_id = ? AND garante_id = ?',
    [contrato_id, garante_id]
  );
  return n > 0;
}

async function link(contrato_id, garante_id) {
  await pool.execute(
    'INSERT INTO contrato_garantes (contrato_id, garante_id) VALUES (?, ?)',
    [contrato_id, garante_id]
  );
}

async function unlink(contrato_id, garante_id) {
  const [result] = await pool.execute(
    'DELETE FROM contrato_garantes WHERE contrato_id = ? AND garante_id = ?',
    [contrato_id, garante_id]
  );
  return result.affectedRows > 0;
}

module.exports = { findByContratoId, findById, findByDni, create, isLinked, link, unlink };
