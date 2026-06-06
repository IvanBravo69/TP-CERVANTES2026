const svc = require('./servicios.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar       = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Servicios obtenidos'));
const obtener      = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear        = handle(async (req, res) => created(res, await svc.crear(req.body), 'Servicio registrado'));
const editar       = handle(async (req, res) => ok(res, await svc.editar(req.params.id, req.body), 'Servicio actualizado'));
const marcarPagado = handle(async (req, res) => ok(res, await svc.marcarPagado(req.params.id, req.body.fecha_pago), 'Servicio marcado como pagado'));

module.exports = { listar, obtener, crear, editar, marcarPagado };
