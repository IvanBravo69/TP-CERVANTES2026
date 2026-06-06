const svc = require('./clientes.service');
const { ok, created, fail } = require('../../utils/response');

const handle = (fn) => async (req, res, next) => {
  try { return await fn(req, res); }
  catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
};

const listar    = handle(async (req, res) => ok(res, await svc.listar(req.query), 'Clientes obtenidos'));
const obtener   = handle(async (req, res) => ok(res, await svc.obtener(req.params.id)));
const crear     = handle(async (req, res) => created(res, await svc.crear(req.body), 'Cliente creado'));
const editar    = handle(async (req, res) => ok(res, await svc.editar(req.params.id, req.body), 'Cliente actualizado'));
const desactivar = handle(async (req, res) => ok(res, await svc.desactivar(req.params.id), 'Cliente desactivado'));
const activar   = handle(async (req, res) => ok(res, await svc.activar(req.params.id), 'Cliente activado'));

module.exports = { listar, obtener, crear, editar, desactivar, activar };
