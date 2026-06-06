const svc = require('./agentes.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar    = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Agentes obtenidos'));
const obtener   = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear     = handle(async (req, res) => created(res, await svc.crear(req.body), 'Agente creado'));
const editar    = handle(async (req, res) => ok(res, await svc.editar(req.params.id, req.body), 'Agente actualizado'));
const activar   = handle(async (req, res) => ok(res, await svc.setActivo(req.params.id, 1), 'Agente activado'));
const desactivar = handle(async (req, res) => ok(res, await svc.setActivo(req.params.id, 0), 'Agente desactivado'));

module.exports = { listar, obtener, crear, editar, activar, desactivar };
