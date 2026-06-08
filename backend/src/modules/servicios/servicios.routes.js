const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./servicios.controller');

const TIPOS = ['Luz','Gas','Agua','Expensas','Municipal','Otro'];

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarCrear = [
  body('propiedad_id').isInt({ min: 1 }).withMessage('propiedad_id requerido'),
  body('tipo').isIn(TIPOS).withMessage(`tipo debe ser: ${TIPOS.join(', ')}`),
  body('proveedor').optional().trim(),
  body('periodo').optional().matches(/^\d{4}-\d{2}$/).withMessage('periodo debe tener formato YYYY-MM'),
  body('monto').optional().isFloat({ min: 0 }).withMessage('monto inválido'),
  body('moneda').optional().isIn(['ARS','USD']),
  body('fecha_vencimiento').optional().isDate().withMessage('fecha_vencimiento inválida (YYYY-MM-DD)'),
  body('observaciones').optional().trim(),
  validate,
];

const validarEditar = [
  body('tipo').optional().isIn(TIPOS),
  body('proveedor').optional().trim(),
  body('periodo').optional().matches(/^\d{4}-\d{2}$/),
  body('monto').optional().isFloat({ min: 0 }),
  body('moneda').optional().isIn(['ARS','USD']),
  body('fecha_vencimiento').optional({ nullable: true }).isDate(),
  body('observaciones').optional().trim(),
  validate,
];

const validarPagar = [
  body('fecha_pago').optional().isDate().withMessage('fecha_pago inválida (YYYY-MM-DD)'),
  validate,
];

router.use(authenticate);

router.get('/',              authorize('VER_SERVICIOS'),    ctrl.listar);
router.get('/:id', validarId, authorize('VER_SERVICIOS'),  ctrl.obtener);
router.post('/',   validarCrear, authorize('CREAR_SERVICIOS'), ctrl.crear);
router.put('/:id', validarId, validarEditar, authorize('EDITAR_SERVICIOS'), ctrl.editar);
router.patch('/:id/pagar', validarId, validarPagar, authorize('EDITAR_SERVICIOS'), ctrl.marcarPagado);

module.exports = router;
