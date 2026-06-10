const model            = require('./contratos.model');
const propModel        = require('../propiedades/propiedades.model');
const clienteModel     = require('../clientes/clientes.model');
const honorariosSvc    = require('../honorarios/honorarios.service');
const serviciosModel   = require('../servicios/servicios.model');
const garanModel       = require('./garantes.model');
const propGaranModel   = require('../propiedades/garantes.model');

const SERVICIOS_BASICOS = ['Luz', 'Gas', 'Agua', 'Expensas', 'Municipal'];

const ESTADOS = ['Activo', 'Finalizado', 'Cancelado'];

const PROP_ESTADO_AL_CREAR = { Venta: 'Vendida', Alquiler: 'Alquilada' };

async function listar(query) {
  const page        = Math.max(1, parseInt(query.page)  || 1);
  const limit       = Math.min(100, parseInt(query.limit) || 20);
  const tipo        = ['Venta','Alquiler'].includes(query.tipo) ? query.tipo : undefined;
  const estado      = ESTADOS.includes(query.estado) ? query.estado : undefined;
  const cliente_id  = query.cliente_id  ? parseInt(query.cliente_id)  : undefined;
  const propiedad_id = query.propiedad_id ? parseInt(query.propiedad_id) : undefined;
  const search      = query.search?.trim() || undefined;
  return model.findAll({ page, limit, tipo, estado, cliente_id, propiedad_id, search });
}

async function obtener(id) {
  const contrato = await model.findById(id);
  if (!contrato) throw { status: 404, message: 'Contrato no encontrado' };
  return contrato;
}

async function crear(data) {
  const { tipo, propiedad_id, cliente_id } = data;

  const cliente = await clienteModel.findById(cliente_id);
  if (!cliente)        throw { status: 404, message: 'Cliente no encontrado' };
  if (!cliente.activo) throw { status: 400, message: 'El cliente está inactivo' };

  const prop = await propModel.findById(propiedad_id);
  if (!prop)        throw { status: 404, message: 'Propiedad no encontrada' };
  if (!prop.activo) throw { status: 400, message: 'La propiedad está inactiva' };

  if (prop.estado !== 'Disponible') {
    throw { status: 409, message: `La propiedad está en estado "${prop.estado}" y no puede contratarse` };
  }

  const garantesProp = await propGaranModel.findByPropiedadId(propiedad_id);
  if (garantesProp.length < 3) {
    throw { status: 400, message: `La propiedad debe tener 3 garantes antes de generar un contrato (tiene ${garantesProp.length})` };
  }

  const contrato = await model.create(data);
  await propModel.setEstado(propiedad_id, PROP_ESTADO_AL_CREAR[tipo]);

  // Copiar garantes de la propiedad al nuevo contrato
  for (const g of garantesProp) {
    const yaVinculado = await garanModel.isLinked(contrato.id, g.id);
    if (!yaVinculado) await garanModel.link(contrato.id, g.id);
  }

  // Auto-generar honorario de cierre según configuración
  const tipoHonorario = tipo === 'Venta' ? 'Cierre_Venta' : 'Cierre_Alquiler';
  await honorariosSvc.autoGenerar(contrato.id, tipoHonorario);

  // Crear servicios seleccionados (o todos los básicos si no se especifica)
  const serviciosACrear = Array.isArray(data.servicios) ? data.servicios : SERVICIOS_BASICOS;
  if (serviciosACrear.length > 0) {
    await Promise.all(
      serviciosACrear.filter(t => SERVICIOS_BASICOS.includes(t))
                     .map(t => serviciosModel.create({ propiedad_id, tipo: t }))
    );
  }

  return contrato;
}

async function editar(id, data) {
  const contrato = await obtener(id);
  if (contrato.estado !== 'Activo') {
    throw { status: 400, message: 'Solo se pueden editar contratos en estado Activo' };
  }
  return model.update(id, data);
}

async function cambiarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Valores: ${ESTADOS.join(', ')}` };
  }

  const contrato = await obtener(id);

  if (contrato.estado === estado) {
    throw { status: 400, message: `El contrato ya está en estado "${estado}"` };
  }

  const resultado = await model.setEstado(id, estado);

  if (estado === 'Finalizado' || estado === 'Cancelado') {
    await propModel.setEstado(contrato.propiedad_id, 'Disponible');
  }

  return resultado;
}

async function renovar(id, data) {
  const contrato = await obtener(id);

  if (contrato.tipo !== 'Alquiler') {
    throw { status: 400, message: 'Solo se pueden renovar contratos de tipo Alquiler' };
  }
  if (contrato.estado !== 'Activo') {
    throw { status: 400, message: 'Solo se pueden renovar contratos en estado Activo' };
  }

  const { nueva_fecha_fin, nuevo_monto, nueva_moneda, observaciones } = data;

  // La nueva fecha de inicio es la fecha_fin del contrato original, o hoy si no tiene
  const nueva_fecha_inicio = contrato.fecha_fin
    ? contrato.fecha_fin.toISOString ? contrato.fecha_fin.toISOString().slice(0, 10) : String(contrato.fecha_fin).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  if (nueva_fecha_fin && nueva_fecha_fin <= nueva_fecha_inicio) {
    throw { status: 400, message: 'nueva_fecha_fin debe ser posterior a la fecha de inicio del nuevo contrato' };
  }

  // Finalizar el original sin liberar la propiedad (la toma el nuevo contrato)
  await model.setEstado(id, 'Finalizado');

  const nuevo = await model.create({
    tipo:               contrato.tipo,
    propiedad_id:       contrato.propiedad_id,
    cliente_id:         contrato.cliente_id,
    agente_id:          contrato.agente_id,
    fecha_inicio:       nueva_fecha_inicio,
    fecha_fin:          nueva_fecha_fin || null,
    monto:              nuevo_monto !== undefined ? nuevo_monto : contrato.monto,
    moneda:             nueva_moneda || contrato.moneda,
    observaciones:      observaciones || null,
    contrato_origen_id: id,
  });

  // Auto-generar honorario de cierre para el nuevo contrato de alquiler renovado
  await honorariosSvc.autoGenerar(nuevo.id, 'Cierre_Alquiler');

  // Copiar garantes de la propiedad al contrato renovado
  const garantesProp = await propGaranModel.findByPropiedadId(contrato.propiedad_id);
  for (const g of garantesProp) {
    const yaVinculado = await garanModel.isLinked(nuevo.id, g.id);
    if (!yaVinculado) await garanModel.link(nuevo.id, g.id);
  }

  return nuevo;
}

module.exports = { listar, obtener, crear, editar, cambiarEstado, renovar };
