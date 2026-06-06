const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./roles.controller');

router.use(authenticate);

router.get('/', authorize('VER_ROLES'), ctrl.listar);
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }), validate],
  authorize('VER_ROLES'),
  ctrl.obtener
);

module.exports = router;
