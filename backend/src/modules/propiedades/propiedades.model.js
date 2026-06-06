const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT p.id, p.tipo, p.operacion, p.titulo, p.descripcion,
         p.direccion, p.ciudad, p.provincia,
         p.precio, p.moneda, p.superficie_m2, p.ambientes,
         p.estado, p.activo, p.created_at, p.updated_at,
         p.propietario_id,
         c.nombre  AS propietario_nombre,
         c.apellido AS propietario_apellido,
         c.telefono AS propietario_telefono,
         p.agente_id,
         a.nombre  AS agente_nombre,
         a.apellido AS agente_apellido,
         a.telefono AS agente_telefono
  FROM propiedades p
  LEFT JOIN clientes c ON c.id = p.propietario_id
  LEFT JOIN agentes  a ON a.id = p.agente_id
`;

async function findAll({ page = 1, limit = 20, activo, tipo, operacion, estado, ciudad, moneda, precio_min, precio_max, agente_id } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (activo !== undefined)  { conditions.push('p.activo = ?');     params.push(activo); }
  if (tipo)                  { conditions.push('p.tipo = ?');       params.push(tipo); }
  if (operacion)             { conditions.push('p.operacion = ?');  params.push(operacion); }
  if (estado)                { conditions.push('p.estado = ?');     params.push(estado); }
  if (ciudad)                { conditions.push('p.ciudad LIKE ?');  params.push(`%${ciudad}%`); }
  if (moneda)                { conditions.push('p.moneda = ?');     params.push(moneda); }
  if (agente_id)             { conditions.push('p.agente_id = ?');  params.push(agente_id); }
  if (precio_min !== undefined) { conditions.push('p.precio >= ?'); params.push(precio_min); }
  if (precio_max !== undefined) { conditions.push('p.precio <= ?'); params.push(precio_max); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM propiedades p ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const {
    tipo, operacion, titulo, descripcion, direccion, ciudad, provincia,
    precio, moneda, superficie_m2, ambientes, propietario_id, agente_id,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO propiedades
       (tipo, operacion, titulo, descripcion, direccion, ciudad, provincia,
        precio, moneda, superficie_m2, ambientes, propietario_id, agente_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo, operacion, titulo, descripcion || null, direccion, ciudad, provincia,
     precio, moneda || 'USD', superficie_m2 || null, ambientes || null,
     propietario_id || null, agente_id || null]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const allowed = [
    'tipo', 'operacion', 'titulo', 'descripcion', 'direccion', 'ciudad',
    'provincia', 'precio', 'moneda', 'superficie_m2', 'ambientes', 'propietario_id', 'agente_id',
  ];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (!sets.length) return findById(id);
  params.push(id);
  await pool.execute(`UPDATE propiedades SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function setEstado(id, estado) {
  await pool.execute('UPDATE propiedades SET estado = ? WHERE id = ?', [estado, id]);
  return findById(id);
}

async function setActivo(id, activo) {
  await pool.execute('UPDATE propiedades SET activo = ? WHERE id = ?', [activo, id]);
  return findById(id);
}

module.exports = { findAll, findById, create, update, setEstado, setActivo };

