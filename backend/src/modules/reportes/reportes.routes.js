const router = require('express').Router();
const { pool } = require('../../config/db');
const { authenticate, authorize } = require('../../middlewares/auth');
const { ok } = require('../../utils/response');

router.use(authenticate, authorize('VER_REPORTES'));

/* Ingresos y egresos de los últimos 12 meses */
router.get('/ingresos-mensuales', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        DATE_FORMAT(fecha_pago, '%Y-%m') AS mes,
        SUM(CASE WHEN tipo='Ingreso' THEN monto ELSE 0 END) AS ingresos,
        SUM(CASE WHEN tipo='Egreso'  THEN monto ELSE 0 END) AS egresos,
        moneda
      FROM pagos
      WHERE fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY mes, moneda
      ORDER BY mes ASC
    `);
    ok(res, rows);
  } catch (err) { next(err); }
});

/* Contratos por mes (últimos 12 meses) */
router.get('/contratos-mensuales', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS mes,
        tipo,
        COUNT(*) AS cantidad,
        SUM(monto) AS monto_total,
        moneda
      FROM contratos
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY mes, tipo, moneda
      ORDER BY mes ASC
    `);
    ok(res, rows);
  } catch (err) { next(err); }
});

/* Propiedades por tipo */
router.get('/propiedades-por-tipo', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT tipo, estado, COUNT(*) AS cantidad
      FROM propiedades
      WHERE activo = 1
      GROUP BY tipo, estado
      ORDER BY tipo, estado
    `);
    ok(res, rows);
  } catch (err) { next(err); }
});

/* Top 10 clientes con más contratos */
router.get('/top-clientes', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        cl.id, cl.nombre, cl.apellido, cl.tipo,
        COUNT(c.id)  AS contratos,
        SUM(c.monto) AS monto_total,
        c.moneda
      FROM clientes cl
      JOIN contratos c ON c.cliente_id = cl.id
      GROUP BY cl.id, c.moneda
      ORDER BY contratos DESC, monto_total DESC
      LIMIT 10
    `);
    ok(res, rows);
  } catch (err) { next(err); }
});

/* Resumen ejecutivo completo */
router.get('/resumen', async (_req, res, next) => {
  try {
    const [[general]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM clientes    WHERE activo = 1)                              AS clientes_activos,
        (SELECT COUNT(*) FROM propiedades WHERE activo = 1)                              AS propiedades_total,
        (SELECT COUNT(*) FROM propiedades WHERE estado='Disponible' AND activo=1)        AS propiedades_disponibles,
        (SELECT COUNT(*) FROM contratos   WHERE estado='Activo')                         AS contratos_activos,
        (SELECT COUNT(*) FROM contratos   WHERE estado='Activo' AND tipo='Alquiler')     AS alquileres_activos,
        (SELECT COUNT(*) FROM contratos   WHERE estado='Activo' AND tipo='Venta')        AS ventas_activas,
        (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE tipo='Ingreso' AND moneda='ARS' AND MONTH(fecha_pago)=MONTH(CURDATE()) AND YEAR(fecha_pago)=YEAR(CURDATE())) AS ingresos_mes_ars,
        (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE tipo='Ingreso' AND moneda='USD' AND MONTH(fecha_pago)=MONTH(CURDATE()) AND YEAR(fecha_pago)=YEAR(CURDATE())) AS ingresos_mes_usd,
        (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE tipo='Ingreso' AND moneda='ARS') AS ingresos_total_ars,
        (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE tipo='Ingreso' AND moneda='USD') AS ingresos_total_usd
    `);
    ok(res, general);
  } catch (err) { next(err); }
});

module.exports = router;
