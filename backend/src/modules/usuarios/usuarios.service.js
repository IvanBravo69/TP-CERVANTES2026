const bcrypt = require('bcryptjs');
const model = require('./usuarios.model');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function listar(query) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const activo = query.activo !== undefined ? (query.activo === 'true' ? 1 : 0) : undefined;
  return model.findAll({ page, limit, activo });
}

async function obtener(id) {
  const usuario = await model.findById(id);
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
  return usuario;
}

async function crear(data) {
  const existeUsername = await model.findByUsername(data.username);
  if (existeUsername) throw { status: 409, message: 'El username ya está en uso' };

  const existeEmail = await model.findByEmail(data.email);
  if (existeEmail) throw { status: 409, message: 'El email ya está en uso' };

  const hash = await bcrypt.hash(data.password, ROUNDS);
  return model.create({ ...data, password: hash });
}

async function editar(id, data) {
  await obtener(id);

  if (data.email) {
    const existeEmail = await model.findByEmail(data.email);
    if (existeEmail && existeEmail.id !== parseInt(id)) {
      throw { status: 409, message: 'El email ya está en uso' };
    }
  }

  const fields = { ...data };
  if (data.password) {
    fields.password = await bcrypt.hash(data.password, ROUNDS);
  }

  return model.update(id, fields);
}

async function desactivar(id) {
  await obtener(id);
  return model.setActivo(id, 0);
}

async function activar(id) {
  await obtener(id);
  return model.setActivo(id, 1);
}

module.exports = { listar, obtener, crear, editar, desactivar, activar };
