const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByUsername, getPermisosByRoleId } = require('./auth.model');

async function login(username, password) {
  const usuario = await findByUsername(username);

  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };
  if (!usuario.activo) throw { status: 403, message: 'Usuario inactivo' };

  const match = await bcrypt.compare(password, usuario.password);
  if (!match) throw { status: 401, message: 'Credenciales inválidas' };

  const permisos = await getPermisosByRoleId(usuario.role_id);

  const payload = {
    id:       usuario.id,
    username: usuario.username,
    role_id:  usuario.role_id,
    role:     usuario.role_nombre,
    permisos,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return {
    token,
    usuario: {
      id:        usuario.id,
      username:  usuario.username,
      full_name: usuario.full_name,
      email:     usuario.email,
      role:      usuario.role_nombre,
      permisos,
    },
  };
}

module.exports = { login };
