const svc = require('./contratos.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar        = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Contratos obtenidos'));
const obtener       = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear         = handle(async (req, res) => created(res, await svc.crear(req.body), 'Contrato creado'));
const editar        = handle(async (req, res) => ok(res, await svc.editar(req.params.id, req.body), 'Contrato actualizado'));
const cambiarEstado = handle(async (req, res) => ok(res, await svc.cambiarEstado(req.params.id, req.body.estado), 'Estado actualizado'));
const renovar       = handle(async (req, res) => created(res, await svc.renovar(req.params.id, req.body), 'Contrato renovado'));

module.exports = { listar, obtener, crear, editar, cambiarEstado, renovar };
