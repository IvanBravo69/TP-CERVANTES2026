USE sistema_britos;

-- Número de comprobante en pagos existentes
ALTER TABLE pagos
  ADD COLUMN nro_comprobante VARCHAR(80) NULL AFTER observaciones;

-- Recibos formales con numeración correlativa automática
CREATE TABLE recibos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  numero          INT UNSIGNED  NOT NULL UNIQUE,
  contrato_id     INT UNSIGNED  NOT NULL,
  pago_id         INT UNSIGNED  NULL,
  tipo            ENUM('Alquiler','Venta','Honorario','Servicio','Otro') NOT NULL DEFAULT 'Alquiler',
  concepto        VARCHAR(200)  NOT NULL,
  monto           DECIMAL(14,2) NOT NULL,
  moneda          ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  fecha           DATE          NOT NULL,
  nro_comprobante VARCHAR(80)   NULL,
  observaciones   TEXT          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_recibo_contrato (contrato_id),
  INDEX idx_recibo_pago     (pago_id),
  INDEX idx_recibo_numero   (numero),
  CONSTRAINT fk_recibo_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
  CONSTRAINT fk_recibo_pago     FOREIGN KEY (pago_id)     REFERENCES pagos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Permisos
INSERT INTO permisos (nombre) VALUES
  ('VER_RECIBOS'),
  ('CREAR_RECIBOS');

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_RECIBOS','CREAR_RECIBOS')
WHERE r.nombre = 'Admin';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_RECIBOS','CREAR_RECIBOS')
WHERE r.nombre = 'Ventas';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_RECIBOS','CREAR_RECIBOS')
WHERE r.nombre = 'Alquileres';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_RECIBOS','CREAR_RECIBOS')
WHERE r.nombre = 'Contabilidad';
