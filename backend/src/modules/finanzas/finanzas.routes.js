const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./finanzas.controller');

const validarId = [param('id').isInt({ min: 1 }), validate];

const validarRegistrar = [
  body('contrato_id').isInt({ min: 1 }).withMessage('contrato_id requerido'),
  body('concepto').trim().notEmpty().withMessage('concepto requerido'),
  body('tipo').isIn(['Ingreso','Egreso']).withMessage('tipo debe ser Ingreso o Egreso'),
  body('monto').isFloat({ min: 0.01 }).withMessage('monto inválido'),
  body('moneda').optional().isIn(['ARS','USD']),
  body('fecha_pago').isDate().withMessage('fecha_pago inválida (YYYY-MM-DD)'),
  body('nro_comprobante').optional().trim(),
  body('observaciones').optional().trim(),
  validate,
];

router.use(authenticate);

router.get('/',                              authorize('VER_FINANZAS'), ctrl.listar);
router.get('/contrato/:contratoId',
  [param('contratoId').isInt({ min: 1 }), validate],
  authorize('VER_FINANZAS'), ctrl.listarPorContrato
);
router.post('/',   validarRegistrar,         authorize('VER_FINANZAS'), ctrl.registrar);
router.delete('/:id', validarId,             authorize('VER_FINANZAS'), ctrl.eliminar);

module.exports = router;
