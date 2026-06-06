const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT r.id, r.numero, r.tipo, r.concepto, r.monto, r.moneda,
         r.fecha, r.nro_comprobante, r.observaciones, r.created_at,
         r.contrato_id, r.pago_id,
         c.tipo      AS contrato_tipo,
         cl.nombre   AS cliente_nombre, cl.apellido AS cliente_apellido,
         p.titulo    AS propiedad_titulo
  FROM recibos r
  JOIN contratos   c  ON c.id  = r.contrato_id
  JOIN clientes    cl ON cl.id = c.cliente_id
  JOIN propiedades p  ON p.id  = c.propiedad_id
`;

async function nextNumero() {
  const [[{ max }]] = await pool.execute('SELECT COALESCE(MAX(numero), 0) AS max FROM recibos');
  return max + 1;
}

async function findAll({ page = 1, limit = 20, tipo, contrato_id, desde, hasta } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (tipo)        { conds.push('r.tipo = ?');          params.push(tipo); }
  if (contrato_id) { conds.push('r.contrato_id = ?');   params.push(contrato_id); }
  if (desde)       { conds.push('r.fecha >= ?');         params.push(desde); }
  if (hasta)       { conds.push('r.fecha <= ?');         params.push(hasta); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM recibos r ${where}`, params);
  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY r.numero DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE r.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ contrato_id, pago_id, tipo, concepto, monto, moneda, fecha, nro_comprobante, observaciones }) {
  const numero = await nextNumero();
  const [result] = await pool.execute(
    `INSERT INTO recibos (numero, contrato_id, pago_id, tipo, concepto, monto, moneda, fecha, nro_comprobante, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [numero, contrato_id, pago_id || null, tipo || 'Alquiler', concepto,
     monto, moneda || 'USD', fecha, nro_comprobante || null, observaciones || null]
  );
  return findById(result.insertId);
}

module.exports = { findAll, findById, create };

