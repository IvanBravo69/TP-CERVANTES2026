const model = require('./roles.model');

async function listar() {
  return model.findAll();
}

async function obtener(id) {
  const rol = await model.findById(id);
  if (!rol) throw { status: 404, message: 'Rol no encontrado' };
  return rol;
}

module.exports = { listar, obtener };
