const svc = require('./garantes.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar  = handle(async (req, res) => ok(res, await svc.listar(req.params.id), 'Garantes obtenidos'));
const agregar = handle(async (req, res) => created(res, await svc.agregar(req.params.id, req.body), 'Garante agregado al contrato'));
const quitar  = handle(async (req, res) => {
  await svc.quitar(req.params.id, req.params.garante_id);
  return ok(res, null, 'Garante eliminado del contrato');
});

module.exports = { listar, agregar, quitar };
