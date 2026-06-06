-- Tabla de garantes y vinculación con contratos
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
  contrato_id  INT UNSIGNED  NOT NULL,
  garante_id   INT UNSIGNED  NOT NULL,
  PRIMARY KEY (contrato_id, garante_id),
  CONSTRAINT fk_cg_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cg_garante  FOREIGN KEY (garante_id)  REFERENCES garantes(id)   ON DELETE RESTRICT
) ENGINE=InnoDB;
