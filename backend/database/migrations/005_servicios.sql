USE sistema_britos;

-- Servicios e impuestos por propiedad (ABL, luz, gas, expensas, etc.)
CREATE TABLE servicios (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  propiedad_id      INT UNSIGNED  NOT NULL,
  tipo              ENUM('ABL','Luz','Gas','Agua','Expensas','Municipal','Otro') NOT NULL,
  proveedor         VARCHAR(120)  NULL,
  periodo           VARCHAR(7)    NULL,     -- YYYY-MM
  monto             DECIMAL(14,2) NULL,
  moneda            ENUM('ARS','USD') NOT NULL DEFAULT 'ARS',
  fecha_vencimiento DATE          NULL,
  fecha_pago        DATE          NULL,
  estado            ENUM('Pendiente','Pagado') NOT NULL DEFAULT 'Pendiente',
  observaciones     TEXT          NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_servicio_propiedad (propiedad_id),
  INDEX idx_servicio_estado    (estado),
  INDEX idx_servicio_tipo      (tipo),
  CONSTRAINT fk_servicio_propiedad FOREIGN KEY (propiedad_id) REFERENCES propiedades(id)
) ENGINE=InnoDB;

-- Permisos
INSERT INTO permisos (nombre) VALUES
  ('VER_SERVICIOS'),
  ('CREAR_SERVICIOS'),
  ('EDITAR_SERVICIOS');

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_SERVICIOS','CREAR_SERVICIOS','EDITAR_SERVICIOS')
WHERE r.nombre = 'Admin';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_SERVICIOS','CREAR_SERVICIOS','EDITAR_SERVICIOS')
WHERE r.nombre = 'Ventas';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_SERVICIOS','CREAR_SERVICIOS','EDITAR_SERVICIOS')
WHERE r.nombre = 'Alquileres';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre = 'VER_SERVICIOS'
WHERE r.nombre = 'Contabilidad';
