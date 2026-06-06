const model = require('./permisos.model');

async function listar() {
  return model.findAll();
}

module.exports = { listar };
