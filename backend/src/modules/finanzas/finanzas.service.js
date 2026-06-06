const model         = require('./finanzas.model');
const contratoModel = require('../contratos/contratos.model');

async function listar(query) {
  const page   = Math.max(1, parseInt(query.page)  || 1);
  const limit  = Math.min(100, parseInt(query.limit) || 20);
  const tipo   = ['Ingreso','Egreso'].includes(query.tipo) ? query.tipo : undefined;
  const moneda = ['ARS','USD'].includes(query.moneda) ? query.moneda : undefined;
  const contrato_id = query.contrato_id ? parseInt(query.contrato_id) : undefined;
  return model.findAll({ page, limit, tipo, moneda, contrato_id, desde: query.desde, hasta: query.hasta });
}

async function listarPorContrato(contrato_id) {
  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  const [pagos, resumen] = await Promise.all([
    model.findByContrato(contrato_id),
    model.resumenPorContrato(contrato_id),
  ]);
  return { contrato, pagos, resumen };
}

async function registrar(data) {
  const contrato = await contratoModel.findById(data.contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  if (contrato.estado === 'Cancelado') throw { status: 400, message: 'No se pueden registrar pagos en contratos cancelados' };
  return model.create(data);
}

async function eliminar(id) {
  const pago = await model.findById(id);
  if (!pago) throw { status: 404, message: 'Pago no encontrado' };
  await model.remove(id);
}

module.exports = { listar, listarPorContrato, registrar, eliminar };
