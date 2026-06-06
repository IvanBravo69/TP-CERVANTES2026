const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT s.id, s.tipo, s.proveedor, s.periodo, s.monto, s.moneda,
         s.fecha_vencimiento, s.fecha_pago, s.estado, s.observaciones,
         s.created_at, s.updated_at,
         s.propiedad_id, p.titulo AS propiedad_titulo, p.direccion AS propiedad_direccion
  FROM servicios s
  JOIN propiedades p ON p.id = s.propiedad_id
`;

async function findAll({ page = 1, limit = 20, propiedad_id, tipo, estado, desde, hasta } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (propiedad_id) { conds.push('s.propiedad_id = ?');        params.push(propiedad_id); }
  if (tipo)         { conds.push('s.tipo = ?');                 params.push(tipo); }
  if (estado)       { conds.push('s.estado = ?');               params.push(estado); }
  if (desde)        { conds.push('s.fecha_vencimiento >= ?');   params.push(desde); }
  if (hasta)        { conds.push('s.fecha_vencimiento <= ?');   params.push(hasta); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM servicios s ${where}`, params);
  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY s.fecha_vencimiento ASC, s.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE s.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ propiedad_id, tipo, proveedor, periodo, monto, moneda, fecha_vencimiento, observaciones }) {
  const [result] = await pool.execute(
    `INSERT INTO servicios (propiedad_id, tipo, proveedor, periodo, monto, moneda, fecha_vencimiento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [propiedad_id, tipo, proveedor || null, periodo || null, monto || null,
     moneda || 'ARS', fecha_vencimiento || null, observaciones || null]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const allowed = ['tipo', 'proveedor', 'periodo', 'monto', 'moneda', 'fecha_vencimiento', 'observaciones'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(data[key] ?? null);
    }
  }

  if (!sets.length) return findById(id);
  params.push(id);
  await pool.execute(`UPDATE servicios SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function pagar(id, fecha_pago) {
  await pool.execute(
    `UPDATE servicios SET estado = 'Pagado', fecha_pago = ? WHERE id = ?`,
    [fecha_pago, id]
  );
  return findById(id);
}

module.exports = { findAll, findById, create, update, pagar };
