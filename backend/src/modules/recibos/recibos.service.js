const model        = require('./recibos.model');
const contratoModel = require('../contratos/contratos.model');

async function listar(query) {
  const page        = Math.max(1, parseInt(query.page)  || 1);
  const limit       = Math.min(100, parseInt(query.limit) || 20);
  const tipo        = ['Alquiler','Venta','Honorario','Servicio','Otro'].includes(query.tipo) ? query.tipo : undefined;
  const contrato_id = query.contrato_id ? parseInt(query.contrato_id) : undefined;
  return model.findAll({ page, limit, tipo, contrato_id, desde: query.desde, hasta: query.hasta });
}

async function obtener(id) {
  const recibo = await model.findById(id);
  if (!recibo) throw { status: 404, message: 'Recibo no encontrado' };
  return recibo;
}

async function emitir(data) {
  const contrato = await contratoModel.findById(data.contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  return model.create(data);
}

module.exports = { listar, obtener, emitir };
