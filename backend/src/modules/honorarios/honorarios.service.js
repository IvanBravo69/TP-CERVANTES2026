const model        = require('./honorarios.model');
const contratoModel = require('../contratos/contratos.model');

const TIPOS = ['Cierre_Venta','Cierre_Alquiler','Administracion'];

async function listar(query) {
  const page        = Math.max(1, parseInt(query.page)  || 1);
  const limit       = Math.min(100, parseInt(query.limit) || 20);
  const tipo        = TIPOS.includes(query.tipo) ? query.tipo : undefined;
  const estado      = ['Pendiente','Cobrado'].includes(query.estado) ? query.estado : undefined;
  const contrato_id = query.contrato_id ? parseInt(query.contrato_id) : undefined;
  return model.findAll({ page, limit, tipo, estado, contrato_id, desde: query.desde, hasta: query.hasta });
}

async function obtener(id) {
  const honorario = await model.findById(id);
  if (!honorario) throw { status: 404, message: 'Honorario no encontrado' };
  return honorario;
}

async function crear(data) {
  const { contrato_id, tipo, periodo } = data;

  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };

  if (!TIPOS.includes(tipo)) {
    throw { status: 400, message: `tipo inválido. Valores: ${TIPOS.join(', ')}` };
  }

  if (tipo === 'Administracion') {
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      throw { status: 400, message: 'periodo requerido para Administracion (YYYY-MM)' };
    }
  }

  const monto = data.monto !== undefined
    ? data.monto
    : await calcularMonto(contrato, tipo);

  return model.create({ ...data, monto, moneda: data.moneda || contrato.moneda });
}

async function calcularMonto(contrato, tipo) {
  const configKey = tipo === 'Cierre_Venta' ? 'Honorario_Venta'
    : tipo === 'Cierre_Alquiler' ? 'Honorario_Alquiler'
    : 'Administracion';
  const pct = await model.getPct(configKey);
  return parseFloat((parseFloat(contrato.monto) * pct / 100).toFixed(2));
}

async function marcarCobrado(id, fecha_cobro) {
  const honorario = await obtener(id);
  if (honorario.estado === 'Cobrado') throw { status: 400, message: 'El honorario ya está cobrado' };
  return model.cobrar(id, fecha_cobro || new Date().toISOString().slice(0, 10));
}

async function getConfig() {
  return model.getConfig();
}

async function updateConfig(configs) {
  for (const { tipo, porcentaje } of configs) {
    const tipos = ['Honorario_Venta','Honorario_Alquiler','Administracion'];
    if (!tipos.includes(tipo)) throw { status: 400, message: `tipo inválido: ${tipo}` };
    if (typeof porcentaje !== 'number' || porcentaje < 0 || porcentaje > 100) {
      throw { status: 400, message: `porcentaje inválido para ${tipo}` };
    }
    await model.updateConfig(tipo, porcentaje);
  }
  return model.getConfig();
}

// Llamado internamente desde contratos.service al crear/renovar un contrato
async function autoGenerar(contrato_id, tipo) {
  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) return;
  const monto = await calcularMonto(contrato, tipo);
  if (monto <= 0) return;
  await model.create({ contrato_id, tipo, monto, moneda: contrato.moneda });
}

module.exports = { listar, obtener, crear, marcarCobrado, getConfig, updateConfig, autoGenerar };
