const model      = require('./garantes.model');
const propModel  = require('./propiedades.model');
const garanModel = require('../contratos/garantes.model');

async function listar(propiedad_id) {
  const prop = await propModel.findById(propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };
  return model.findByPropiedadId(propiedad_id);
}

async function agregar(propiedad_id, data) {
  const prop = await propModel.findById(propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };

  // Reutilizar garante existente si coincide el DNI
  let garante = data.dni_cuit ? await garanModel.findByDni(data.dni_cuit) : null;
  if (!garante) garante = await garanModel.create(data);

  const yaVinculado = await model.isLinked(propiedad_id, garante.id);
  if (yaVinculado) throw { status: 409, message: 'El garante ya está vinculado a esta propiedad' };

  await model.link(propiedad_id, garante.id);
  return garante;
}

async function quitar(propiedad_id, garante_id) {
  const prop = await propModel.findById(propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };

  const eliminado = await model.unlink(propiedad_id, garante_id);
  if (!eliminado) throw { status: 404, message: 'Garante no encontrado en esta propiedad' };
}

module.exports = { listar, agregar, quitar };
