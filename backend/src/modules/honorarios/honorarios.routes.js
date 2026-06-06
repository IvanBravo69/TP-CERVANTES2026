const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./honorarios.controller');

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarCrear = [
  body('contrato_id').isInt({ min: 1 }).withMessage('contrato_id requerido'),
  body('tipo').isIn(['Cierre_Venta','Cierre_Alquiler','Administracion']).withMessage('tipo inválido'),
  body('periodo').optional().matches(/^\d{4}-\d{2}$/).withMessage('periodo debe tener formato YYYY-MM'),
  body('monto').optional().isFloat({ min: 0 }).withMessage('monto inválido'),
  body('moneda').optional().isIn(['ARS','USD']),
  body('observaciones').optional().trim(),
  validate,
];

const validarCobrar = [
  body('fecha_cobro').optional().isDate().withMessage('fecha_cobro inválida (YYYY-MM-DD)'),
  validate,
];

const validarConfig = [
  body('configs').isArray({ min: 1 }).withMessage('configs debe ser un array'),
  body('configs.*.tipo').isIn(['Honorario_Venta','Honorario_Alquiler','Administracion']),
  body('configs.*.porcentaje').isFloat({ min: 0, max: 100 }).withMessage('porcentaje debe ser entre 0 y 100'),
  validate,
];

router.use(authenticate);

router.get('/',              authorize('VER_HONORARIOS'),       ctrl.listar);
router.get('/config',        authorize('VER_HONORARIOS'),       ctrl.getConfig);
router.put('/config', validarConfig, authorize('GESTIONAR_HONORARIOS'), ctrl.updateConfig);
router.get('/:id', validarId, authorize('VER_HONORARIOS'),     ctrl.obtener);
router.post('/', validarCrear, authorize('GESTIONAR_HONORARIOS'), ctrl.crear);
router.patch('/:id/cobrar', validarId, validarCobrar, authorize('GESTIONAR_HONORARIOS'), ctrl.marcarCobrado);

module.exports = router;
