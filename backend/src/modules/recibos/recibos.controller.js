const svc = require('./recibos.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar  = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Recibos obtenidos'));
const obtener = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const emitir  = handle(async (req, res) => created(res, await svc.emitir(req.body), 'Recibo emitido'));

module.exports = { listar, obtener, emitir };
