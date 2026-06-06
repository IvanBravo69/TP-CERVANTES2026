const svc = require('./finanzas.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar           = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Pagos obtenidos'));
const listarPorContrato = handle(async (req, res) => ok(res, await svc.listarPorContrato(req.params.contratoId)));
const registrar        = handle(async (req, res) => created(res, await svc.registrar(req.body), 'Pago registrado'));
const eliminar         = handle(async (req, res) => { await svc.eliminar(req.params.id); ok(res, null, 'Pago eliminado'); });

module.exports = { listar, listarPorContrato, registrar, eliminar };
