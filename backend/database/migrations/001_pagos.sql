USE sistema_britos;

CREATE TABLE IF NOT EXISTS pagos (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  contrato_id   INT UNSIGNED  NOT NULL,
  concepto      VARCHAR(200)  NOT NULL,
  tipo          ENUM('Ingreso','Egreso') NOT NULL DEFAULT 'Ingreso',
  monto         DECIMAL(14,2) NOT NULL,
  moneda        ENUM('ARS','USD') NOT NULL DEFAULT 'USD',
  fecha_pago    DATE          NOT NULL,
  observaciones TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pago_contrato (contrato_id),
  INDEX idx_pago_fecha    (fecha_pago),
  INDEX idx_pago_tipo     (tipo),
  CONSTRAINT fk_pago_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)
) ENGINE=InnoDB;
