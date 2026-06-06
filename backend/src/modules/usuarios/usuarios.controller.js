const svc = require('./usuarios.service');
const { ok, created, fail } = require('../../utils/response');

async function listar(req, res, next) {
  try {
    const data = await svc.listar(req.query);
    ok(res, data, 'Usuarios obtenidos');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const data = await svc.obtener(req.params.id);
    ok(res, data);
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    const data = await svc.crear(req.body);
    created(res, data, 'Usuario creado');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

async function editar(req, res, next) {
  try {
    const data = await svc.editar(req.params.id, req.body);
    ok(res, data, 'Usuario actualizado');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

async function desactivar(req, res, next) {
  try {
    const data = await svc.desactivar(req.params.id);
    ok(res, data, 'Usuario desactivado');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

async function activar(req, res, next) {
  try {
    const data = await svc.activar(req.params.id);
    ok(res, data, 'Usuario activado');
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

module.exports = { listar, obtener, crear, editar, desactivar, activar };
