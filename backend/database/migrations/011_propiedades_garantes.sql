-- Tabla de vinculación garantes ↔ propiedades
CREATE TABLE propiedad_garantes (
  propiedad_id  INT UNSIGNED  NOT NULL,
  garante_id    INT UNSIGNED  NOT NULL,
  PRIMARY KEY (propiedad_id, garante_id),
  CONSTRAINT fk_pg_propiedad FOREIGN KEY (propiedad_id) REFERENCES propiedades(id) ON DELETE CASCADE,
  CONSTRAINT fk_pg_garante   FOREIGN KEY (garante_id)  REFERENCES garantes(id)    ON DELETE RESTRICT
) ENGINE=InnoDB;
