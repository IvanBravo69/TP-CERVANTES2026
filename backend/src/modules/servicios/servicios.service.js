const model    = require('./servicios.model');
const propModel = require('../propiedades/propiedades.model');

const TIPOS = ['ABL','Luz','Gas','Agua','Expensas','Municipal','Otro'];

async function listar(query) {
  const page        = Math.max(1, parseInt(query.page)  || 1);
  const limit       = Math.min(100, parseInt(query.limit) || 20);
  const propiedad_id = query.propiedad_id ? parseInt(query.propiedad_id) : undefined;
  const tipo        = TIPOS.includes(query.tipo) ? query.tipo : undefined;
  const estado      = ['Pendiente','Pagado'].includes(query.estado) ? query.estado : undefined;
  return model.findAll({ page, limit, propiedad_id, tipo, estado, desde: query.desde, hasta: query.hasta });
}

async function obtener(id) {
  const servicio = await model.findById(id);
  if (!servicio) throw { status: 404, message: 'Servicio no encontrado' };
  return servicio;
}

async function crear(data) {
  const prop = await propModel.findById(data.propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };
  return model.create(data);
}

async function editar(id, data) {
  await obtener(id);
  return model.update(id, data);
}

async function marcarPagado(id, fecha_pago) {
  const servicio = await obtener(id);
  if (servicio.estado === 'Pagado') throw { status: 400, message: 'El servicio ya está marcado como Pagado' };
  return model.pagar(id, fecha_pago || new Date().toISOString().slice(0, 10));
}

module.exports = { listar, obtener, crear, editar, marcarPagado };
