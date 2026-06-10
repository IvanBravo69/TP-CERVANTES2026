const svc = require('./garantes.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar    = handle(async (req, res) => ok(res, await svc.listar(req.params.id), 'Garantes obtenidos'));
const agregar   = handle(async (req, res) => created(res, await svc.agregar(req.params.id, req.body), 'Garante agregado a la propiedad'));
const quitar    = handle(async (req, res) => {
  await svc.quitar(req.params.id, req.params.garante_id);
  return ok(res, null, 'Garante eliminado de la propiedad');
});

const listarAdj = handle(async (req, res) =>
  ok(res, await svc.listarAdjuntos(req.params.garante_id), 'Adjuntos obtenidos'));

const subirAdj  = handle(async (req, res) => {
  const { tipo, nombre, mime_type, data } = req.body;
  const result = await svc.subirAdjunto(req.params.id, req.params.garante_id, tipo, nombre, mime_type, data);
  return ok(res, result, 'Adjunto guardado');
});

const verAdj    = handle(async (req, res) =>
  ok(res, await svc.verAdjunto(req.params.id, req.params.garante_id, req.params.tipo), 'Adjunto obtenido'));

const elimAdj   = handle(async (req, res) => {
  await svc.eliminarAdjunto(req.params.id, req.params.garante_id, req.params.tipo);
  return ok(res, null, 'Adjunto eliminado');
});

module.exports = { listar, agregar, quitar, listarAdj, subirAdj, verAdj, elimAdj };
