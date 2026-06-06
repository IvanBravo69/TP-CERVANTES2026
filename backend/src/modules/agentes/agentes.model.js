const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT id, nombre, apellido, dni_cuit, email, telefono, matricula, comision_pct, activo, created_at, updated_at
  FROM agentes
`;

async function findAll({ page = 1, limit = 20, activo, search } = {}) {
  const offset = (page - 1) * limit;
  const conds  = [];
  const params = [];

  if (activo !== undefined) { conds.push('activo = ?'); params.push(activo); }
  if (search) {
    conds.push('(nombre LIKE ? OR apellido LIKE ? OR dni_cuit LIKE ? OR matricula LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM agentes ${where}`, params);
  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create({ nombre, apellido, dni_cuit, email, telefono, matricula, comision_pct }) {
  const [result] = await pool.execute(
    `INSERT INTO agentes (nombre, apellido, dni_cuit, email, telefono, matricula, comision_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, dni_cuit || null, email || null, telefono || null, matricula || null, comision_pct ?? 0]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const allowed = ['nombre', 'apellido', 'dni_cuit', 'email', 'telefono', 'matricula', 'comision_pct'];
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
  await pool.execute(`UPDATE agentes SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function setActivo(id, activo) {
  await pool.execute('UPDATE agentes SET activo = ? WHERE id = ?', [activo, id]);
  return findById(id);
}

module.exports = { findAll, findById, create, update, setActivo };
