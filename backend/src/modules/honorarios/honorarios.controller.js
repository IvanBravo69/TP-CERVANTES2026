const svc = require('./honorarios.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar        = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Honorarios obtenidos'));
const obtener       = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear         = handle(async (req, res) => created(res, await svc.crear(req.body), 'Honorario registrado'));
const marcarCobrado = handle(async (req, res) => ok(res, await svc.marcarCobrado(req.params.id, req.body.fecha_cobro), 'Honorario marcado como cobrado'));
const getConfig     = handle(async (req, res) => ok(res, await svc.getConfig(), 'Configuración de comisiones'));
const updateConfig  = handle(async (req, res) => ok(res, await svc.updateConfig(req.body.configs), 'Configuración actualizada'));

module.exports = { listar, obtener, crear, marcarCobrado, getConfig, updateConfig };
