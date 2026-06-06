ALTER TABLE clientes
  ADD COLUMN razon_social VARCHAR(200)  NULL AFTER nombre,
  ADD COLUMN descripcion  VARCHAR(100)  NULL AFTER apellido,
  ADD COLUMN pais         VARCHAR(100)  NULL DEFAULT 'Argentina' AFTER direccion,
  ADD COLUMN provincia    VARCHAR(100)  NULL AFTER pais,
  ADD COLUMN presupuesto  DECIMAL(15,2) NULL AFTER provincia,
  ADD COLUMN moneda       CHAR(3)       NULL DEFAULT 'ARS' AFTER presupuesto;
