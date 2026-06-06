const model = require('./propiedades.model');
const clientesModel = require('../clientes/clientes.model');

const TIPOS      = ['Casa', 'Departamento', 'Local', 'Terreno', 'Oficina', 'Otro'];
const OPERACIONES = ['Venta', 'Alquiler', 'Venta y Alquiler'];
const ESTADOS    = ['Disponible', 'Reservada', 'Vendida', 'Alquilada'];
const MONEDAS    = ['ARS', 'USD'];

async function listar(query) {
  const page      = Math.max(1, parseInt(query.page)  || 1);
  const limit     = Math.min(100, parseInt(query.limit) || 20);
  const activo    = query.activo !== undefined ? (query.activo === 'false' ? 0 : 1) : 1;
  const tipo      = TIPOS.includes(query.tipo)           ? query.tipo      : undefined;
  const operacion = OPERACIONES.includes(query.operacion) ? query.operacion : undefined;
  const estado    = ESTADOS.includes(query.estado)        ? query.estado    : undefined;
  const moneda    = MONEDAS.includes(query.moneda)        ? query.moneda    : undefined;
  const precio_min = query.precio_min ? parseFloat(query.precio_min) : undefined;
  const precio_max = query.precio_max ? parseFloat(query.precio_max) : undefined;

  return model.findAll({ page, limit, activo, tipo, operacion, estado, ciudad: query.ciudad, moneda, precio_min, precio_max });
}

async function obtener(id) {
  const prop = await model.findById(id);
  if (!prop) throw { status: 404, message: 'Propiedad no encontrada' };
  return prop;
}

async function crear(data) {
  if (data.propietario_id) {
    const cliente = await clientesModel.findById(data.propietario_id);
    if (!cliente) throw { status: 404, message: 'Propietario no encontrado' };
    if (!cliente.activo) throw { status: 400, message: 'El propietario está inactivo' };
  }
  return model.create(data);
}

async function editar(id, data) {
  await obtener(id);
  if (data.propietario_id) {
    const cliente = await clientesModel.findById(data.propietario_id);
    if (!cliente) throw { status: 404, message: 'Propietario no encontrado' };
  }
  return model.update(id, data);
}

async function cambiarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Valores posibles: ${ESTADOS.join(', ')}` };
  }
  await obtener(id);
  return model.setEstado(id, estado);
}

async function desactivar(id) {
  await obtener(id);
  return model.setActivo(id, 0);
}

async function activar(id) {
  await obtener(id);
  return model.setActivo(id, 1);
}

module.exports = { listar, obtener, crear, editar, cambiarEstado, desactivar, activar };
