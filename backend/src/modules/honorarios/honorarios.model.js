const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT h.id, h.tipo, h.periodo, h.monto, h.moneda,
         h.estado, h.fecha_cobro, h.observaciones,
         h.created_at, h.updated_at,
         h.contrato_id,
         c.tipo      AS contrato_tipo,
         cl.nombre   AS cliente_nombre, cl.apellido AS cliente_apellido,
         p.titulo    AS propiedad_titulo
  FROM honorarios h
  JOIN contratos   c  ON c.id  = h.contrato_id
  JOIN clientes    cl ON cl.id = c.cliente_id
  JOIN propiedades p  ON p.id  = c.propiedad_id
`;

async function findAll({ page = 1, limit = 20, tipo, estado, contrato_id, desde, hasta } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (tipo)        { conds.push('h.tipo = ?');          params.push(tipo); }
  if (estado)      { conds.push('h.estado = ?');        params.push(estado); }
  if (contrato_id) { conds.push('h.contrato_id = ?');   params.push(contrato_id); }
  if (desde)       { conds.push('h.created_at >= ?');   params.push(desde); }
  if (hasta)       { conds.push('h.created_at <= ?');   params.push(hasta); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM honorarios h ${where}`, params);
  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY h.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE h.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ contrato_id, tipo, periodo, monto, moneda, observaciones }) {
  const [result] = await pool.execute(
    `INSERT INTO honorarios (contrato_id, tipo, periodo, monto, moneda, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [contrato_id, tipo, periodo || null, monto, moneda || 'USD', observaciones || null]
  );
  return findById(result.insertId);
}

async function cobrar(id, fecha_cobro) {
  await pool.execute(
    `UPDATE honorarios SET estado = 'Cobrado', fecha_cobro = ? WHERE id = ?`,
    [fecha_cobro, id]
  );
  return findById(id);
}

// Config comisiones
async function getConfig() {
  const [rows] = await pool.execute('SELECT tipo, porcentaje FROM config_comisiones ORDER BY id');
  return rows;
}

async function updateConfig(tipo, porcentaje) {
  await pool.execute(
    'UPDATE config_comisiones SET porcentaje = ? WHERE tipo = ?',
    [porcentaje, tipo]
  );
}

async function getPct(tipo) {
  const [[row]] = await pool.execute(
    'SELECT porcentaje FROM config_comisiones WHERE tipo = ? LIMIT 1',
    [tipo]
  );
  return row ? parseFloat(row.porcentaje) : 0;
}

module.exports = { findAll, findById, create, cobrar, getConfig, updateConfig, getPct };

