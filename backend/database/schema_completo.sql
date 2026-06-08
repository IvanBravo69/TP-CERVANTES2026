-- ============================================================
-- SISTEMA BRITOS — Schema completo con todas las migraciones
-- ============================================================

USE defaultdb;

-- Limpia tablas existentes (en orden inverso de dependencias)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS honorarios;
DROP TABLE IF EXISTS config_comisiones;
DROP TABLE IF EXISTS recibos;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS contrato_garantes;
DROP TABLE IF EXISTS garantes;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS propiedades;
DROP TABLE IF EXISTS agentes;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles_permisos;
DROP TABLE IF EXISTS permisos;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE roles (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre  VARCHAR(50)  NOT NULL UNIQUE,
  activo  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE permisos (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80)  NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE roles_permisos (
  role_id    INT UNSIGNED NOT NULL,
  permiso_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permiso_id),
  CONSTRAINT fk_rp_role    FOREIGN KEY (role_id)    REFERENCES roles(id)    ON DELETE CASCADE,
  CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  full_name  VARCHAR(120) NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  role_id    INT UNSIGNED NOT NULL,
  activo     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_username (username),
  INDEX idx_email    (email),
  INDEX idx_role     (role_id),
  CONSTRAINT fk_usuario_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo         ENUM('Persona','Empresa') NOT NULL DEFAULT 'Persona',
  nombre       VARCHAR(120)  NOT NULL,
  apellido     VARCHAR(120)  NULL,
  razon_social VARCHAR(200)  NULL,
  descripcion  VARCHAR(100)  NULL,
  dni_cuit     VARCHAR(30)   NULL UNIQUE,
  email        VARCHAR(120)  NULL,
  telefono     VARCHAR(30)   NULL,
  direccion    VARCHAR(200)  NULL,
  pais         VARCHAR(100)  NULL DEFAULT 'Argentina',
  provincia    VARCHAR(100)  NULL,
  presupuesto  DECIMAL(15,2) NULL,
  moneda       CHAR(3)       NULL DEFAULT 'ARS',
  activo       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_dni    (dni_cuit),
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB;

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

CREATE TABLE propiedades (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo           ENUM('Casa','Departamento','Local','Terreno','Oficina','Otro') NOT NULL,
  operacion      ENUM('Venta','Alquiler','Venta y Alquiler') NOT NULL,
  titulo         VARCHAR(200)  NOT NULL,
  descripcion    TEXT          NULL,
  direccion      VARCHAR(200)  NOT NULL,
  ciudad         VARCHAR(80)   NOT NULL,
  provincia      VARCHAR(80)   NOT NULL,
  precio         DECIMAL(14,2) NOT NULL,
  moneda         ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  superficie_m2  DECIMAL(8,2)  NULL,
  ambientes      TINYINT       NULL,
  estado         ENUM('Disponible','Reservada','Vendida','Alquilada') NOT NULL DEFAULT 'Disponible',
  propietario_id INT UNSIGNED  NULL,
  agente_id      INT UNSIGNED  NULL,
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_estado      (estado),
  INDEX idx_operacion   (operacion),
  INDEX idx_tipo        (tipo),
  INDEX idx_prop_agente (agente_id),
  CONSTRAINT fk_prop_propietario FOREIGN KEY (propietario_id) REFERENCES clientes(id),
  CONSTRAINT fk_prop_agente      FOREIGN KEY (agente_id)      REFERENCES agentes(id)
) ENGINE=InnoDB;

CREATE TABLE contratos (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo               ENUM('Venta','Alquiler') NOT NULL,
  propiedad_id       INT UNSIGNED  NOT NULL,
  cliente_id         INT UNSIGNED  NOT NULL,
  agente_id          INT UNSIGNED  NULL,
  fecha_inicio       DATE          NOT NULL,
  fecha_fin          DATE          NULL,
  monto              DECIMAL(14,2) NOT NULL,
  moneda             ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  estado             ENUM('Activo','Finalizado','Cancelado') NOT NULL DEFAULT 'Activo',
  observaciones      TEXT          NULL,
  contrato_origen_id INT UNSIGNED  NULL,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_contrato_propiedad (propiedad_id),
  INDEX idx_contrato_cliente   (cliente_id),
  INDEX idx_contrato_agente    (agente_id),
  INDEX idx_contrato_origen    (contrato_origen_id),
  CONSTRAINT fk_contrato_propiedad FOREIGN KEY (propiedad_id)       REFERENCES propiedades(id),
  CONSTRAINT fk_contrato_cliente   FOREIGN KEY (cliente_id)         REFERENCES clientes(id),
  CONSTRAINT fk_contrato_agente    FOREIGN KEY (agente_id)          REFERENCES agentes(id),
  CONSTRAINT fk_contrato_origen    FOREIGN KEY (contrato_origen_id) REFERENCES contratos(id)
) ENGINE=InnoDB;

CREATE TABLE garantes (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(120)  NOT NULL,
  apellido      VARCHAR(120)  NULL,
  dni_cuit      VARCHAR(30)   NULL UNIQUE,
  telefono      VARCHAR(30)   NULL,
  email         VARCHAR(120)  NULL,
  direccion     VARCHAR(200)  NULL,
  observaciones TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_garante_dni (dni_cuit)
) ENGINE=InnoDB;

CREATE TABLE contrato_garantes (
  contrato_id INT UNSIGNED NOT NULL,
  garante_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (contrato_id, garante_id),
  CONSTRAINT fk_cg_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE,
  CONSTRAINT fk_cg_garante  FOREIGN KEY (garante_id)  REFERENCES garantes(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE pagos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  contrato_id     INT UNSIGNED  NOT NULL,
  concepto        VARCHAR(200)  NOT NULL,
  tipo            ENUM('Ingreso','Egreso') NOT NULL DEFAULT 'Ingreso',
  monto           DECIMAL(14,2) NOT NULL,
  moneda          ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  fecha_pago      DATE          NOT NULL,
  observaciones   TEXT          NULL,
  nro_comprobante VARCHAR(80)   NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pago_contrato (contrato_id),
  INDEX idx_pago_fecha    (fecha_pago),
  INDEX idx_pago_tipo     (tipo),
  CONSTRAINT fk_pago_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)
) ENGINE=InnoDB;

CREATE TABLE servicios (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  propiedad_id      INT UNSIGNED  NOT NULL,
  tipo              ENUM('Luz','Gas','Agua','Expensas','Municipal','Otro') NOT NULL,
  proveedor         VARCHAR(120)  NULL,
  periodo           VARCHAR(7)    NULL,
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

CREATE TABLE config_comisiones (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo       ENUM('Honorario_Venta','Honorario_Alquiler','Administracion') NOT NULL UNIQUE,
  porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE honorarios (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  contrato_id   INT UNSIGNED  NOT NULL,
  tipo          ENUM('Cierre_Venta','Cierre_Alquiler','Administracion') NOT NULL,
  periodo       VARCHAR(7)    NULL,
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

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO roles (nombre) VALUES
  ('Admin'), ('Ventas'), ('Alquileres'), ('Contabilidad');

INSERT INTO permisos (nombre) VALUES
  ('VER_USUARIOS'), ('CREAR_USUARIOS'), ('EDITAR_USUARIOS'), ('DESACTIVAR_USUARIOS'),
  ('VER_ROLES'), ('VER_PERMISOS'),
  ('VER_CLIENTES'), ('CREAR_CLIENTES'), ('EDITAR_CLIENTES'),
  ('VER_PROPIEDADES'), ('CREAR_PROPIEDADES'), ('EDITAR_PROPIEDADES'),
  ('VER_CONTRATOS'), ('CREAR_CONTRATOS'), ('EDITAR_CONTRATOS'),
  ('VER_FINANZAS'), ('VER_REPORTES'),
  ('VER_AGENTES'), ('CREAR_AGENTES'), ('EDITAR_AGENTES'),
  ('VER_SERVICIOS'), ('CREAR_SERVICIOS'), ('EDITAR_SERVICIOS'),
  ('VER_RECIBOS'), ('CREAR_RECIBOS'),
  ('VER_HONORARIOS'), ('GESTIONAR_HONORARIOS');

-- Admin: todos los permisos
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 1, id FROM permisos;

-- Ventas
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 2, id FROM permisos WHERE nombre IN (
  'VER_CLIENTES','CREAR_CLIENTES','EDITAR_CLIENTES',
  'VER_PROPIEDADES','CREAR_PROPIEDADES','EDITAR_PROPIEDADES',
  'VER_CONTRATOS','CREAR_CONTRATOS',
  'VER_AGENTES','CREAR_AGENTES','EDITAR_AGENTES',
  'VER_SERVICIOS','CREAR_SERVICIOS','EDITAR_SERVICIOS',
  'VER_RECIBOS','CREAR_RECIBOS','VER_HONORARIOS'
);

-- Alquileres
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 3, id FROM permisos WHERE nombre IN (
  'VER_CLIENTES','CREAR_CLIENTES','EDITAR_CLIENTES',
  'VER_PROPIEDADES','VER_CONTRATOS','CREAR_CONTRATOS','EDITAR_CONTRATOS',
  'VER_AGENTES',
  'VER_SERVICIOS','CREAR_SERVICIOS','EDITAR_SERVICIOS',
  'VER_RECIBOS','CREAR_RECIBOS','VER_HONORARIOS'
);

-- Contabilidad
INSERT INTO roles_permisos (role_id, permiso_id)
SELECT 4, id FROM permisos WHERE nombre IN (
  'VER_FINANZAS','VER_REPORTES','VER_CONTRATOS','VER_CLIENTES',
  'VER_AGENTES','VER_SERVICIOS',
  'VER_RECIBOS','CREAR_RECIBOS',
  'VER_HONORARIOS','GESTIONAR_HONORARIOS'
);

-- Usuario admin por defecto  password: Admin1234!
INSERT INTO usuarios (username, password, full_name, email, role_id) VALUES
  ('admin',
   '$2a$12$K8GpOhHPFxHPpGCk6i9cQOhL8vBExNJalIv5KRZDrj63MBvlxH8uy',
   'Administrador Sistema',
   'admin@sistemabitos.com',
   1);

INSERT INTO config_comisiones (tipo, porcentaje) VALUES
  ('Honorario_Venta', 3.00),
  ('Honorario_Alquiler', 5.00),
  ('Administracion', 10.00);
