const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT p.id, p.concepto, p.tipo, p.monto, p.moneda,
         p.fecha_pago, p.nro_comprobante, p.observaciones, p.created_at,
         p.contrato_id,
         c.tipo      AS contrato_tipo,
         cl.nombre   AS cliente_nombre, cl.apellido AS cliente_apellido,
         pr.titulo   AS propiedad_titulo
  FROM pagos p
  JOIN contratos   c  ON c.id  = p.contrato_id
  JOIN clientes    cl ON cl.id = c.cliente_id
  JOIN propiedades pr ON pr.id = c.propiedad_id
`;

async function findAll({ page = 1, limit = 20, tipo, moneda, contrato_id, desde, hasta } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (tipo)        { conds.push('p.tipo = ?');         params.push(tipo); }
  if (moneda)      { conds.push('p.moneda = ?');       params.push(moneda); }
  if (contrato_id) { conds.push('p.contrato_id = ?');  params.push(contrato_id); }
  if (desde)       { conds.push('p.fecha_pago >= ?');  params.push(desde); }
  if (hasta)       { conds.push('p.fecha_pago <= ?');  params.push(hasta); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM pagos p ${where}`, params
  );

  const [[totales]] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN p.tipo='Ingreso' AND p.moneda='ARS' THEN p.monto END),0) AS ing_ars,
       COALESCE(SUM(CASE WHEN p.tipo='Ingreso' AND p.moneda='USD' THEN p.monto END),0) AS ing_usd,
       COALESCE(SUM(CASE WHEN p.tipo='Egreso'  AND p.moneda='ARS' THEN p.monto END),0) AS eg_ars,
       COALESCE(SUM(CASE WHEN p.tipo='Egreso'  AND p.moneda='USD' THEN p.monto END),0) AS eg_usd
     FROM pagos p ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY p.fecha_pago DESC, p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, page, limit, totales, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByContrato(contrato_id) {
  const [rows] = await pool.execute(
    `${SELECT_BASE} WHERE p.contrato_id = ? ORDER BY p.fecha_pago DESC`, [contrato_id]
  );
  return rows;
}

async function resumenPorContrato(contrato_id) {
  const [[row]] = await pool.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo='Ingreso' THEN monto END),0) AS total_ingresos,
       COALESCE(SUM(CASE WHEN tipo='Egreso'  THEN monto END),0) AS total_egresos,
       COUNT(*) AS cantidad
     FROM pagos WHERE contrato_id = ?`,
    [contrato_id]
  );
  return row;
}

async function create({ contrato_id, concepto, tipo, monto, moneda, fecha_pago, nro_comprobante, observaciones }) {
  const [result] = await pool.execute(
    `INSERT INTO pagos (contrato_id, concepto, tipo, monto, moneda, fecha_pago, nro_comprobante, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [contrato_id, concepto, tipo || 'Ingreso', monto, moneda || 'USD', fecha_pago, nro_comprobante || null, observaciones || null]
  );
  return findById(result.insertId);
}

async function remove(id) {
  await pool.execute('DELETE FROM pagos WHERE id = ?', [id]);
}

module.exports = { findAll, findById, findByContrato, resumenPorContrato, create, remove };

