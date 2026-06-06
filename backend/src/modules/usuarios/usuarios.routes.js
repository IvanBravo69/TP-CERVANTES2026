const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./usuarios.controller');

const validarId = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  validate,
];

const validarCrear = [
  body('username').trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  body('full_name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('role_id').isInt({ min: 1 }).withMessage('role_id inválido'),
  validate,
];

const validarEditar = [
  body('full_name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('role_id').optional().isInt({ min: 1 }),
  validate,
];

router.use(authenticate);

router.get('/',    authorize('VER_USUARIOS'),       ctrl.listar);
router.get('/:id', validarId, authorize('VER_USUARIOS'), ctrl.obtener);
router.post('/',   validarCrear, authorize('CREAR_USUARIOS'), ctrl.crear);
router.put('/:id', validarId, validarEditar, authorize('EDITAR_USUARIOS'), ctrl.editar);
router.patch('/:id/desactivar', validarId, authorize('DESACTIVAR_USUARIOS'), ctrl.desactivar);
router.patch('/:id/activar',    validarId, authorize('DESACTIVAR_USUARIOS'), ctrl.activar);

module.exports = router;
