-- Adjuntos de garantes (recibo, frente/dorso DNI) en base64
CREATE TABLE garante_adjuntos (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  garante_id INT UNSIGNED  NOT NULL,
  tipo       ENUM('recibo','frente_dni','dorso_dni') NOT NULL,
  nombre     VARCHAR(200)  NULL,
  mime_type  VARCHAR(100)  NULL,
  data       MEDIUMTEXT    NOT NULL,
  created_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_gar_tipo (garante_id, tipo),
  CONSTRAINT fk_ga_garante FOREIGN KEY (garante_id) REFERENCES garantes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
