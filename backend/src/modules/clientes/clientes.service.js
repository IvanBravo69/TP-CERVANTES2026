const model = require('./clientes.model');

async function listar(query) {
  const page   = Math.max(1, parseInt(query.page)  || 1);
  const limit  = Math.min(100, parseInt(query.limit) || 20);
  const activo = query.activo !== undefined ? (query.activo === 'true' ? 1 : 0) : undefined;
  const tipo   = ['Inquilino', 'Propietario'].includes(query.tipo) ? query.tipo : undefined;
  return model.findAll({ page, limit, activo, tipo, search: query.search });
}

async function obtener(id) {
  const cliente = await model.findById(id);
  if (!cliente) throw { status: 404, message: 'Cliente no encontrado' };
  const propiedades = await model.getPropiedades(id);
  return { ...cliente, propiedades };
}

async function crear(data) {
  if (data.dni_cuit) {
    const existe = await model.findByDniCuit(data.dni_cuit);
    if (existe) throw { status: 409, message: 'Ya existe un cliente con ese DNI/CUIT' };
  }
  return model.create(data);
}

async function editar(id, data) {
  await obtener(id);
  if (data.dni_cuit) {
    const existe = await model.findByDniCuit(data.dni_cuit);
    if (existe && existe.id !== parseInt(id)) {
      throw { status: 409, message: 'El DNI/CUIT ya está registrado en otro cliente' };
    }
  }
  return model.update(id, data);
}

async function desactivar(id) {
  await obtener(id);
  return model.setActivo(id, 0);
}

async function activar(id) {
  await obtener(id);
  return model.setActivo(id, 1);
}

module.exports = { listar, obtener, crear, editar, desactivar, activar };
