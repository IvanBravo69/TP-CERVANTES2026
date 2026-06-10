const model      = require('./garantes.model');
const propModel  = require('./propiedades.model');
const garanModel = require('../contratos/garantes.model');

const TIPOS_ADJ = ['recibo', 'frente_dni', 'dorso_dni'];
const MAX_GARANTES = 3;

async function listar(propiedad_id) {
  const prop = await propModel.findById(propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };
  return model.findByPropiedadId(propiedad_id);
}

async function agregar(propiedad_id, data) {
  const prop = await propModel.findById(propiedad_id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };

  const count = await model.countByPropiedadId(propiedad_id);
  if (count >= MAX_GARANTES) {
    throw { status: 409, message: `Máximo ${MAX_GARANTES} garantes por propiedad` };
  }

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

// ── Adjuntos ──────────────────────────────────────────────────────────────

async function listarAdjuntos(garante_id) {
  return model.listAdjuntos(garante_id);
}

async function subirAdjunto(propiedad_id, garante_id, tipo, nombre, mime_type, data) {
  if (!TIPOS_ADJ.includes(tipo)) throw { status: 400, message: `tipo debe ser: ${TIPOS_ADJ.join(', ')}` };
  if (!data) throw { status: 400, message: 'data (base64) es requerido' };

  const vinculado = await model.isLinked(propiedad_id, garante_id);
  if (!vinculado) throw { status: 404, message: 'Garante no vinculado a esta propiedad' };

  return model.saveAdjunto(garante_id, tipo, nombre, mime_type, data);
}

async function verAdjunto(propiedad_id, garante_id, tipo) {
  if (!TIPOS_ADJ.includes(tipo)) throw { status: 400, message: `tipo inválido` };

  const vinculado = await model.isLinked(propiedad_id, garante_id);
  if (!vinculado) throw { status: 404, message: 'Garante no vinculado a esta propiedad' };

  const adj = await model.getAdjunto(garante_id, tipo);
  if (!adj) throw { status: 404, message: 'Adjunto no encontrado' };
  return adj;
}

async function eliminarAdjunto(propiedad_id, garante_id, tipo) {
  if (!TIPOS_ADJ.includes(tipo)) throw { status: 400, message: `tipo inválido` };

  const vinculado = await model.isLinked(propiedad_id, garante_id);
  if (!vinculado) throw { status: 404, message: 'Garante no vinculado a esta propiedad' };

  const eliminado = await model.deleteAdjunto(garante_id, tipo);
  if (!eliminado) throw { status: 404, message: 'Adjunto no encontrado' };
}

module.exports = { listar, agregar, quitar, listarAdjuntos, subirAdjunto, verAdjunto, eliminarAdjunto };
