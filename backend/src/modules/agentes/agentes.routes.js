const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./agentes.controller');

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const validarCrear = [
  body('nombre').trim().notEmpty().withMessage('nombre requerido'),
  body('apellido').trim().notEmpty().withMessage('apellido requerido'),
  body('dni_cuit').optional().trim(),
  body('email').optional().isEmail().withMessage('email inválido'),
  body('telefono').optional().trim(),
  body('matricula').optional().trim(),
  body('comision_pct').optional().isFloat({ min: 0, max: 100 }).withMessage('comision_pct debe ser entre 0 y 100'),
  validate,
];

const validarEditar = [
  body('nombre').optional().trim().notEmpty(),
  body('apellido').optional().trim().notEmpty(),
  body('dni_cuit').optional().trim(),
  body('email').optional().isEmail().withMessage('email inválido'),
  body('telefono').optional().trim(),
  body('matricula').optional().trim(),
  body('comision_pct').optional().isFloat({ min: 0, max: 100 }),
  validate,
];

router.use(authenticate);

router.get('/',              authorize('VER_AGENTES'),    ctrl.listar);
router.get('/:id', validarId, authorize('VER_AGENTES'),   ctrl.obtener);
router.post('/',   validarCrear, authorize('CREAR_AGENTES'), ctrl.crear);
router.put('/:id', validarId, validarEditar, authorize('EDITAR_AGENTES'), ctrl.editar);
router.patch('/:id/activar',    validarId, authorize('EDITAR_AGENTES'), ctrl.activar);
router.patch('/:id/desactivar', validarId, authorize('EDITAR_AGENTES'), ctrl.desactivar);

module.exports = router;
