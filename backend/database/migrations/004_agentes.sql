USE sistema_britos;

-- Tabla de agentes/corredores inmobiliarios
CREATE TABLE agentes (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(120)  NOT NULL,
  apellido     VARCHAR(120)  NOT NULL,
  dni_cuit     VARCHAR(30)   NULL UNIQUE,
  email        VARCHAR(120)  NULL,
  telefono     VARCHAR(30)   NULL,
  matricula    VARCHAR(50)   NULL,
  comision_pct DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  activo       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_agente_dni (dni_cuit)
) ENGINE=InnoDB;

-- Agente asignado a la propiedad
ALTER TABLE propiedades
  ADD COLUMN agente_id INT UNSIGNED NULL DEFAULT NULL AFTER propietario_id,
  ADD INDEX idx_prop_agente (agente_id),
  ADD CONSTRAINT fk_prop_agente FOREIGN KEY (agente_id) REFERENCES agentes(id);

-- Agente que gestionó el contrato
ALTER TABLE contratos
  ADD COLUMN agente_id INT UNSIGNED NULL DEFAULT NULL AFTER contrato_origen_id,
  ADD INDEX idx_contrato_agente (agente_id),
  ADD CONSTRAINT fk_contrato_agente FOREIGN KEY (agente_id) REFERENCES agentes(id);

-- Permisos
INSERT INTO permisos (nombre) VALUES
  ('VER_AGENTES'),
  ('CREAR_AGENTES'),
  ('EDITAR_AGENTES');

-- Asignación por nombre de rol (no por ID hardcodeado)
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_AGENTES','CREAR_AGENTES','EDITAR_AGENTES')
WHERE r.nombre = 'Admin';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre IN ('VER_AGENTES','CREAR_AGENTES','EDITAR_AGENTES')
WHERE r.nombre = 'Ventas';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre = 'VER_AGENTES'
WHERE r.nombre = 'Alquileres';

INSERT INTO roles_permisos (role_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.nombre = 'VER_AGENTES'
WHERE r.nombre = 'Contabilidad';
