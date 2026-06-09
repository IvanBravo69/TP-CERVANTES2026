const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT id, tipo, nombre, apellido, razon_social, dni_cuit, email, telefono,
         direccion, pais, provincia, descripcion, presupuesto, moneda, activo, created_at, updated_at
  FROM clientes
`;

async function findAll({ page = 1, limit = 20, activo, tipo, search } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (activo !== undefined) { conditions.push('activo = ?');  params.push(activo); }
  if (tipo)                 { conditions.push('tipo = ?');    params.push(tipo); }
  if (search) {
    conditions.push('(nombre LIKE ? OR apellido LIKE ? OR dni_cuit LIKE ? OR email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM clientes ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByDniCuit(dni_cuit) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE dni_cuit = ? LIMIT 1`, [dni_cuit]);
  return rows[0] || null;
}

async function getPropiedades(clienteId) {
  const [rows] = await pool.execute(
    `SELECT id, tipo, operacion, titulo, ciudad, provincia, precio, moneda, estado
     FROM propiedades
     WHERE propietario_id = ? AND activo = 1
     ORDER BY id DESC`,
    [clienteId]
  );
  return rows;
}

async function create(data) {
  const { tipo, nombre, apellido, razon_social, dni_cuit, email, telefono,
          direccion, pais, provincia, descripcion, presupuesto, moneda } = data;
  const [result] = await pool.execute(
    `INSERT INTO clientes
       (tipo, nombre, apellido, razon_social, dni_cuit, email, telefono,
        direccion, pais, provincia, descripcion, presupuesto, moneda)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo || 'Inquilino', nombre, apellido || null, razon_social || null,
     dni_cuit || null, email || null, telefono || null, direccion || null,
     pais || 'Argentina', provincia || null, descripcion || null,
     presupuesto || null, moneda || 'ARS']
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const allowed = ['tipo', 'nombre', 'apellido', 'razon_social', 'dni_cuit', 'email', 'telefono',
                   'direccion', 'pais', 'provincia', 'descripcion', 'presupuesto', 'moneda'];
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
  await pool.execute(`UPDATE clientes SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function setActivo(id, activo) {
  await pool.execute('UPDATE clientes SET activo = ? WHERE id = ?', [activo, id]);
  return findById(id);
}

module.exports = { findAll, findById, findByDniCuit, getPropiedades, create, update, setActivo };

