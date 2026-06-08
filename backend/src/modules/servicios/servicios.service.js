const model        = require('./servicios.model');
const propModel    = require('../propiedades/propiedades.model');
const finanzasModel = require('../finanzas/finanzas.model');

const TIPOS = ['Luz','Gas','Agua','Expensas','Municipal','Otro'];

async function listar(query) {
  const page        = Math.max(1, parseInt(query.page)  || 1);
  const limit       = Math.min(100, parseInt(query.limit) || 20);
  const propiedad_id = query.propiedad_id ? parseInt(query.propiedad_id) : undefined;
  const tipo        = TIPOS.includes(query.tipo) ? query.tipo : undefined;
  const estado      = ['Pendiente','Pagado'].includes(query.estado) ? query.estado : undefined;
  const contrato_id = query.contrato_id ? parseInt(query.contrato_id) : undefined;
  return model.findAll({ page, limit, propiedad_id, tipo, estado, desde: query.desde, hasta: query.hasta, contrato_id });
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

  const fecha = fecha_pago || new Date().toISOString().slice(0, 10);
  const resultado = await model.pagar(id, fecha);

  if (servicio.contrato_id) {
    await finanzasModel.create({
      contrato_id:    servicio.contrato_id,
      concepto:       `Servicio: ${servicio.tipo}${servicio.periodo ? ' — ' + servicio.periodo : ''}`,
      tipo:           'Ingreso',
      monto:          servicio.monto || 0,
      moneda:         servicio.moneda || 'ARS',
      fecha_pago:     fecha,
    });
  }

  return resultado;
}

module.exports = { listar, obtener, crear, editar, marcarPagado };
