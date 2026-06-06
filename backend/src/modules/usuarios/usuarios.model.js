const { pool } = require('../../config/db');

const SELECT_BASE = `
  SELECT u.id, u.username, u.full_name, u.email, u.activo, u.created_at,
         r.id AS role_id, r.nombre AS role_nombre
  FROM usuarios u
  JOIN roles r ON r.id = u.role_id
`;

async function findAll({ page = 1, limit = 20, activo } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (activo !== undefined) {
    conditions.push('u.activo = ?');
    params.push(activo);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM usuarios u ${where}`,
    params
  );

  const [rows] = await pool.execute(
    `${SELECT_BASE} ${where} ORDER BY u.id DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return { total, page, limit, rows };
}

async function findById(id) {
  const [rows] = await pool.execute(`${SELECT_BASE} WHERE u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByUsername(username) {
  const [rows] = await pool.execute(
    `${SELECT_BASE} WHERE u.username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `${SELECT_BASE} WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function create({ username, password, full_name, email, role_id }) {
  const [result] = await pool.execute(
    `INSERT INTO usuarios (username, password, full_name, email, role_id)
     VALUES (?, ?, ?, ?, ?)`,
    [username, password, full_name, email, role_id]
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const allowed = ['full_name', 'email', 'role_id', 'password'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }

  if (!sets.length) return findById(id);

  params.push(id);
  await pool.execute(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function setActivo(id, activo) {
  await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  findByUsername,
  findByEmail,
  create,
  update,
  setActivo,
};

