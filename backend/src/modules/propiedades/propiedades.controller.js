const svc = require('./propiedades.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar       = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Propiedades obtenidas'));
const obtener      = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear        = handle(async (req, res) => created(res, await svc.crear(req.body), 'Propiedad creada'));
const editar       = handle(async (req, res) => ok(res, await svc.editar(req.params.id, req.body), 'Propiedad actualizada'));
const cambiarEstado = handle(async (req, res) => ok(res, await svc.cambiarEstado(req.params.id, req.body.estado), 'Estado actualizado'));
const desactivar   = handle(async (req, res) => ok(res, await svc.desactivar(req.params.id), 'Propiedad desactivada'));
const activar      = handle(async (req, res) => ok(res, await svc.activar(req.params.id), 'Propiedad activada'));

module.exports = { listar, obtener, crear, editar, cambiarEstado, desactivar, activar };
