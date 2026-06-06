const router = require('express').Router();

router.use('/auth',         require('../modules/auth/auth.routes'));
router.use('/usuarios',     require('../modules/usuarios/usuarios.routes'));
router.use('/roles',        require('../modules/roles/roles.routes'));
router.use('/permisos',     require('../modules/permisos/permisos.routes'));
router.use('/clientes',     require('../modules/clientes/clientes.routes'));
router.use('/propiedades',  require('../modules/propiedades/propiedades.routes'));
router.use('/agentes',      require('../modules/agentes/agentes.routes'));
router.use('/contratos',    require('../modules/contratos/contratos.routes'));
router.use('/finanzas',     require('../modules/finanzas/finanzas.routes'));
router.use('/servicios',    require('../modules/servicios/servicios.routes'));
router.use('/recibos',      require('../modules/recibos/recibos.routes'));
router.use('/honorarios',   require('../modules/honorarios/honorarios.routes'));
router.use('/reportes',     require('../modules/reportes/reportes.routes'));
router.use('/stats',        require('../modules/stats/stats.routes'));

module.exports = router;
