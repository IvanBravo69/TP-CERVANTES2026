const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT
    c.id, c.tipo, c.fecha_inicio, c.fecha_fin,
    c.monto, c.moneda, c.estado, c.observaciones,
    c.contrato_origen_id, c.agente_id,
    c.created_at, c.updated_at,
    c.propiedad_id, p.titulo   AS propiedad_titulo,
    p.direccion AS propiedad_direccion, p.ciudad AS propiedad_ciudad,
    c.cliente_id,
    cl.nombre   AS cliente_nombre,  cl.apellido AS cliente_apellido,
    cl.dni_cuit AS cliente_dni,     cl.telefono AS cliente_telefono,
    cl.email    AS cliente_email,
    a.nombre    AS agente_nombre,   a.apellido  AS agente_apellido,
    a.telefono  AS agente_telefono
  FROM contratos c
  JOIN propiedades p  ON p.id  = c.propiedad_id
  JOIN clientes   cl ON cl.id = c.cliente_id
  LEFT JOIN agentes a ON a.id = c.agente_id
`;

async function findAll({ page = 1, limit = 20, tipo, estado, cliente_id, propiedad_id, agente_id, search } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (tipo)         { conds.push('c.tipo = ?');         params.push(tipo); }
  if (estado)       { conds.push('c.estado = ?');       params.push(estado); }
  if (cliente_id)   { conds.push('c.cliente_id = ?');   params.push(cliente_id); }
  if (propiedad_id) { conds.push('c.propiedad_id = ?'); params.push(propiedad_id); }
  if (agente_id)    { conds.push('c.agente_id = ?');    params.push(agente_id); }
  if (search) {
    const like = `%${search}%`;
    conds.push('(c.id = ? OR CONCAT(cl.nombre," ",cl.apellido) LIKE ? OR cl.apellido LIKE ? OR p.titulo LIKE ?)');
    params.push(Number(search) || 0, like, like, like);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM contratos c JOIN propiedades p ON p.id = c.propiedad_id JOIN clientes cl ON cl.id = c.cliente_id LEFT JOIN agentes a ON a.id = c.agente_id ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY c.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE c.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ tipo, propiedad_id, cliente_id, fecha_inicio, fecha_fin, monto, moneda, observaciones, contrato_origen_id, agente_id }) {
  const [result] = await pool.execute(
    `INSERT INTO contratos (tipo, propiedad_id, cliente_id, fecha_inicio, fecha_fin, monto, moneda, observaciones, contrato_origen_id, agente_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo, propiedad_id, cliente_id, fecha_inicio, fecha_fin || null, monto, moneda || 'USD',
     observaciones || null, contrato_origen_id || null, agente_id || null]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const allowed = ['fecha_inicio', 'fecha_fin', 'monto', 'moneda', 'observaciones', 'agente_id'];
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
  await pool.execute(`UPDATE contratos SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.execute('UPDATE contratos SET estado = ? WHERE id = ?', [estado, id]);
  return findById(id);
}

module.exports = { findAll, findById, create, update, setEstado };

