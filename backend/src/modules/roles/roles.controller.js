const svc = require('./roles.service');
const { ok, fail } = require('../../utils/response');

async function listar(req, res, next) {
  try {
    ok(res, await svc.listar(), 'Roles obtenidos');
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    ok(res, await svc.obtener(req.params.id));
  } catch (err) {
    if (err.status) return fail(res, err.message, err.status);
    next(err);
  }
}

module.exports = { listar, obtener };
