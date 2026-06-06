const model        = require('./garantes.model');
const contratoModel = require('./contratos.model');

async function listar(contrato_id) {
  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  return model.findByContratoId(contrato_id);
}

async function agregar(contrato_id, data) {
  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };

  // Si se envía dni_cuit y ya existe ese garante, reutilizarlo en lugar de crear duplicado
  let garante = data.dni_cuit ? await model.findByDni(data.dni_cuit) : null;
  if (!garante) {
    garante = await model.create(data);
  }

  const yaVinculado = await model.isLinked(contrato_id, garante.id);
  if (yaVinculado) throw { status: 409, message: 'El garante ya está vinculado a este contrato' };

  await model.link(contrato_id, garante.id);
  return garante;
}

async function quitar(contrato_id, garante_id) {
  const contrato = await contratoModel.findById(contrato_id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };

  const eliminado = await model.unlink(contrato_id, garante_id);
  if (!eliminado) throw { status: 404, message: 'Garante no encontrado en este contrato' };
}

module.exports = { listar, agregar, quitar };
