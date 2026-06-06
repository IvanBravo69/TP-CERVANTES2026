const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl         = require('./contratos.controller');
const garanCtrl    = require('./garantes.controller');

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarGaranteId = [
  param('id').isInt({ min: 1 }).withMessage('ID de contrato inválido'),
  param('garante_id').isInt({ min: 1 }).withMessage('ID de garante inválido'),
  validate,
];

const validarCrear = [
  body('tipo').isIn(['Venta','Alquiler']).withMessage('tipo debe ser Venta o Alquiler'),
  body('propiedad_id').isInt({ min: 1 }).withMessage('propiedad_id requerido'),
  body('cliente_id').isInt({ min: 1 }).withMessage('cliente_id requerido'),
  body('fecha_inicio').isDate().withMessage('fecha_inicio inválida (YYYY-MM-DD)'),
  body('fecha_fin').optional({ nullable: true }).isDate().withMessage('fecha_fin inválida'),
  body('monto').isFloat({ min: 0 }).withMessage('monto debe ser numérico positivo'),
  body('moneda').optional().isIn(['ARS','USD']),
  body('observaciones').optional().trim(),
  validate,
];

const validarEditar = [
  body('fecha_inicio').optional().isDate(),
  body('fecha_fin').optional({ nullable: true }).isDate(),
  body('monto').optional().isFloat({ min: 0 }),
  body('moneda').optional().isIn(['ARS','USD']),
  body('observaciones').optional().trim(),
  validate,
];

const validarEstado = [
  body('estado').isIn(['Activo','Finalizado','Cancelado']).withMessage('estado inválido'),
  validate,
];

const validarRenovar = [
  body('nueva_fecha_fin').optional({ nullable: true }).isDate().withMessage('nueva_fecha_fin inválida (YYYY-MM-DD)'),
  body('nuevo_monto').optional().isFloat({ min: 0 }).withMessage('nuevo_monto debe ser numérico positivo'),
  body('nueva_moneda').optional().isIn(['ARS','USD']),
  body('observaciones').optional().trim(),
  validate,
];

const validarGarante = [
  body('nombre').notEmpty().withMessage('nombre es requerido').trim(),
  body('apellido').optional().trim(),
  body('dni_cuit').optional().trim(),
  body('telefono').optional().trim(),
  body('email').optional().isEmail().withMessage('email inválido'),
  body('direccion').optional().trim(),
  body('observaciones').optional().trim(),
  validate,
];

router.use(authenticate);

// Contratos
router.get('/',     authorize('VER_CONTRATOS'),     ctrl.listar);
router.get('/:id',  validarId, authorize('VER_CONTRATOS'), ctrl.obtener);
router.post('/',    validarCrear, authorize('CREAR_CONTRATOS'), ctrl.crear);
router.put('/:id',  validarId, validarEditar, authorize('EDITAR_CONTRATOS'), ctrl.editar);
router.patch('/:id/estado',  validarId, validarEstado,  authorize('EDITAR_CONTRATOS'), ctrl.cambiarEstado);
router.post('/:id/renovar',  validarId, validarRenovar, authorize('CREAR_CONTRATOS'),  ctrl.renovar);

// Garantes de un contrato
router.get('/:id/garantes',                    validarId,        authorize('VER_CONTRATOS'),    garanCtrl.listar);
router.post('/:id/garantes',                   validarId, validarGarante, authorize('EDITAR_CONTRATOS'), garanCtrl.agregar);
router.delete('/:id/garantes/:garante_id',     validarGaranteId, authorize('EDITAR_CONTRATOS'), garanCtrl.quitar);

module.exports = router;
