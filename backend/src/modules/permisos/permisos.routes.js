const router = require('express').Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const ctrl = require('./permisos.controller');

router.use(authenticate);
router.get('/', authorize('VER_PERMISOS'), ctrl.listar);

module.exports = router;
