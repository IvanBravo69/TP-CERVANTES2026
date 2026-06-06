const model = require('./agentes.model');

async function listar(query) {
  const page   = Math.max(1, parseInt(query.page)  || 1);
  const limit  = Math.min(100, parseInt(query.limit) || 20);
  const activo = query.activo !== undefined ? (query.activo === 'true' || query.activo === '1' ? 1 : 0) : undefined;
  const search = query.search?.trim() || undefined;
  return model.findAll({ page, limit, activo, search });
}

async function obtener(id) {
  const agente = await model.findById(id);
  if (!agente) throw { status: 404, message: 'Agente no encontrado' };
  return agente;
}

async function crear(data) {
  return model.create(data);
}

async function editar(id, data) {
  await obtener(id);
  return model.update(id, data);
}

async function setActivo(id, activo) {
  await obtener(id);
  return model.setActivo(id, activo);
}

module.exports = { listar, obtener, crear, editar, setActivo };
