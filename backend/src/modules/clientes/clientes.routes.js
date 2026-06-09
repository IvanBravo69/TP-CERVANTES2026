const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./clientes.controller');

const validarId = [param('id').isInt({ min: 1 }).withMessage('ID inválido'), validate];

const DESCRIPCIONES = ['Inquilino','Propietario','Comprador','Vendedor','Inversor','Garante','Otro'];

const validarCrear = [
  body('tipo').optional().isIn(['Inquilino', 'Propietario']),
  body('nombre').trim().notEmpty().withMessage('nombre requerido'),
  body('apellido').optional().trim(),
  body('razon_social').optional().trim().isLength({ max: 200 }),
  body('descripcion').optional().isIn(DESCRIPCIONES),
  body('dni_cuit').optional().trim().isLength({ max: 30 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim().isLength({ max: 30 }),
  body('direccion').optional().trim(),
  body('pais').optional().trim().isLength({ max: 100 }),
  body('provincia').optional().trim().isLength({ max: 100 }),
  body('presupuesto').optional({ nullable: true }).isFloat({ min: 0 }),
  body('moneda').optional().isIn(['ARS', 'USD']),
  validate,
];

const validarEditar = [
  body('tipo').optional().isIn(['Inquilino', 'Propietario']),
  body('nombre').optional().trim().notEmpty(),
  body('apellido').optional().trim(),
  body('razon_social').optional().trim().isLength({ max: 200 }),
  body('descripcion').optional().isIn(DESCRIPCIONES),
  body('dni_cuit').optional().trim().isLength({ max: 30 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim().isLength({ max: 30 }),
  body('direccion').optional().trim(),
  body('pais').optional().trim().isLength({ max: 100 }),
  body('provincia').optional().trim().isLength({ max: 100 }),
  body('presupuesto').optional({ nullable: true }).isFloat({ min: 0 }),
  body('moneda').optional().isIn(['ARS', 'USD']),
  validate,
];

router.use(authenticate);

router.get('/',     authorize('VER_CLIENTES'),        ctrl.listar);
router.get('/:id',  validarId, authorize('VER_CLIENTES'),    ctrl.obtener);
router.post('/',    validarCrear, authorize('CREAR_CLIENTES'), ctrl.crear);
router.put('/:id',  validarId, validarEditar, authorize('EDITAR_CLIENTES'), ctrl.editar);
router.patch('/:id/desactivar', validarId, authorize('EDITAR_CLIENTES'), ctrl.desactivar);
router.patch('/:id/activar',    validarId, authorize('EDITAR_CLIENTES'), ctrl.activar);

module.exports = router;
