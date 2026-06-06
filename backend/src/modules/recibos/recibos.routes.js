const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./recibos.controller');

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarEmitir = [
  body('contrato_id').isInt({ min: 1 }).withMessage('contrato_id requerido'),
  body('pago_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('tipo').optional().isIn(['Alquiler','Venta','Honorario','Servicio','Otro']),
  body('concepto').trim().notEmpty().withMessage('concepto requerido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('monto inválido'),
  body('moneda').optional().isIn(['ARS','USD']),
  body('fecha').isDate().withMessage('fecha inválida (YYYY-MM-DD)'),
  body('nro_comprobante').optional().trim(),
  body('observaciones').optional().trim(),
  validate,
];

router.use(authenticate);

router.get('/',              authorize('VER_RECIBOS'),   ctrl.listar);
router.get('/:id', validarId, authorize('VER_RECIBOS'),  ctrl.obtener);
router.post('/', validarEmitir, authorize('CREAR_RECIBOS'), ctrl.emitir);

module.exports = router;
