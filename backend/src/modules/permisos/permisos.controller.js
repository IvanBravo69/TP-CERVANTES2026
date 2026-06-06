const svc = require('./permisos.service');
const { ok } = require('../../utils/response');

async function listar(req, res, next) {
  try {
    ok(res, await svc.listar(), 'Permisos obtenidos');
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
