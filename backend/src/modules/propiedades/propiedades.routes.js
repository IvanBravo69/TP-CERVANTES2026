const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./propiedades.controller');

const TIPOS       = ['Casa', 'Departamento', 'Local', 'Terreno', 'Oficina', 'Otro'];
const OPERACIONES = ['Venta', 'Alquiler', 'Venta y Alquiler'];
const ESTADOS     = ['Disponible', 'Reservada', 'Vendida', 'Alquilada'];
const MONEDAS     = ['ARS', 'USD'];

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarCrear = [
  body('tipo').isIn(TIPOS).withMessage(`tipo debe ser: ${TIPOS.join(', ')}`),
  body('operacion').optional().isIn(OPERACIONES),
  body('titulo').optional().trim(),
  body('descripcion').optional().trim(),
  body('direccion').trim().notEmpty().withMessage('direccion requerida'),
  body('ciudad').trim().notEmpty().withMessage('ciudad requerida'),
  body('provincia').trim().notEmpty().withMessage('provincia requerida'),
  body('precio').isFloat({ min: 0 }).withMessage('precio debe ser numérico positivo'),
  body('moneda').optional().isIn(MONEDAS),
  body('superficie_m2').optional().isFloat({ min: 0 }),
  body('ambientes').optional().isInt({ min: 0 }),
  body('propietario_id').optional().isInt({ min: 1 }),
  validate,
];

const validarEditar = [
  body('tipo').optional().isIn(TIPOS),
  body('operacion').optional().isIn(OPERACIONES),
  body('titulo').optional().trim().notEmpty(),
  body('precio').optional().isFloat({ min: 0 }),
  body('moneda').optional().isIn(MONEDAS),
  body('superficie_m2').optional().isFloat({ min: 0 }),
  body('ambientes').optional().isInt({ min: 0 }),
  body('propietario_id').optional().isInt({ min: 1 }),
  validate,
];

const validarEstado = [
  body('estado').isIn(ESTADOS).withMessage(`estado debe ser: ${ESTADOS.join(', ')}`),
  validate,
];

router.use(authenticate);

router.get('/',    authorize('VER_PROPIEDADES'), ctrl.listar);
router.get('/:id', validarId, authorize('VER_PROPIEDADES'), ctrl.obtener);
router.post('/',   validarCrear, authorize('CREAR_PROPIEDADES'), ctrl.crear);
router.put('/:id', validarId, validarEditar, authorize('EDITAR_PROPIEDADES'), ctrl.editar);
router.patch('/:id/estado',      validarId, validarEstado, authorize('EDITAR_PROPIEDADES'), ctrl.cambiarEstado);
router.patch('/:id/desactivar',  validarId, authorize('EDITAR_PROPIEDADES'), ctrl.desactivar);
router.patch('/:id/activar',     validarId, authorize('EDITAR_PROPIEDADES'), ctrl.activar);

module.exports = router;
