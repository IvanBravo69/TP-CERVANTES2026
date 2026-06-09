const router = require('express').Router();
const { pool } = require('../../config/db');
const { authenticate } = require('../../middlewares/auth');
const { ok } = require('../../utils/response');

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM clientes    WHERE activo = 1)                              AS total_clientes,
        (SELECT COUNT(*) FROM propiedades WHERE activo = 1)                              AS total_propiedades,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Disponible' AND activo = 1)   AS disponibles,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Reservada'  AND activo = 1)   AS reservadas,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Alquilada'  AND activo = 1)   AS alquiladas,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Vendida'    AND activo = 1)   AS vendidas,
        (SELECT COUNT(*) FROM contratos   WHERE estado = 'Activo')                      AS contratos_activos,
        (SELECT COUNT(*) FROM usuarios    WHERE activo = 1)                             AS total_usuarios
    `);
    const [ultimas_propiedades] = await pool.execute(
      `SELECT id, direccion, tipo, estado FROM propiedades WHERE activo = 1 ORDER BY id DESC LIMIT 5`
    );
    ok(res, { ...stats, ultimas_propiedades }, 'Stats obtenidas');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
