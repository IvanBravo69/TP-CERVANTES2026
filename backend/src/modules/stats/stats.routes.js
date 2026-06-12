const router = require('express').Router();
const { pool } = require('../../config/db');
const { authenticate } = require('../../middlewares/auth');
const { ok } = require('../../utils/response');

router.get('/', authenticate, async (req, res, next) => {
  const { desde, hasta } = req.query;
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const hasRange = desde && hasta && dateRe.test(desde) && dateRe.test(hasta);

  const cF = hasRange ? `AND DATE(created_at)   BETWEEN '${desde}' AND '${hasta}'` : '';
  const cC = hasRange ? `AND DATE(fecha_inicio)  BETWEEN '${desde}' AND '${hasta}'` : '';

  try {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM clientes    WHERE activo = 1 ${cF})                             AS total_clientes,
        (SELECT COUNT(*) FROM propiedades WHERE activo = 1 ${cF})                             AS total_propiedades,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Disponible' AND activo = 1 ${cF})  AS disponibles,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Reservada'  AND activo = 1 ${cF})  AS reservadas,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Alquilada'  AND activo = 1 ${cF})  AS alquiladas,
        (SELECT COUNT(*) FROM propiedades WHERE estado = 'Vendida'    AND activo = 1 ${cF})  AS vendidas,
        (SELECT COUNT(*) FROM contratos   WHERE estado = 'Activo' ${cC})                     AS contratos_activos,
        (SELECT COUNT(*) FROM usuarios    WHERE activo = 1 ${cF})                            AS total_usuarios
    `);
    const [ultimas_propiedades] = await pool.execute(
      `SELECT id, direccion, tipo, estado FROM propiedades WHERE activo = 1 ${cF} ORDER BY id DESC LIMIT 5`
    );
    ok(res, { ...stats, ultimas_propiedades }, 'Stats obtenidas');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
