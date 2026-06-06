USE sistema_britos;

-- Configuración de porcentajes de comisiones
CREATE TABLE config_comisiones (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo        ENUM('Honorario_Venta','Honorario_Alquiler','Administracion') NOT NULL UNIQUE,
  porcentaje  DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT INTO config_comisiones (tipo, porcentaje) VALUES
  ('Honorario_Venta',    3.00),
  ('Honorario_Alquiler', 5.00),
  ('Administracion',    10.00);

-- Honorarios de la inmobiliaria (cierre de operación + administración mensual)
CREATE TABLE honorarios (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  contrato_id   INT UNSIGNED  NOT NULL,
  tipo          ENUM('Cierre_Venta','Cierre_Alquiler','Administracion') NOT NULL,
  periodo       VARCHAR(7)    NULL,        -- YYYY-MM (solo para Administracion)
  monto         DECIMAL(14,2) NOT NULL,
  moneda        ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  estado        ENUM('Pendiente','Cobrado') NOT NULL DEFAULT 'Pendiente',
  fecha_cobro   DATE          NULL,
  observaciones TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_honorario_contrato (contrato_id),
  INDEX idx_honorario_estado   (estado),
  INDEX idx_honorario_tipo     (tipo),
  CONSTRAINT fk_honorario_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)
) ENGINE=InnoDB;

-- Permisos
INSERT INTO permisos (nombre) VALUES
  ('VER_HONORARIOS'),
  ('GESTIONAR_HONORARIOS');

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_HONORARIOS','GESTIONAR_HONORARIOS')
WHERE r.nombre = 'Admin';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre = 'VER_HONORARIOS'
WHERE r.nombre = 'Ventas';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre = 'VER_HONORARIOS'
WHERE r.nombre = 'Alquileres';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_HONORARIOS','GESTIONAR_HONORARIOS')
WHERE r.nombre = 'Contabilidad';
