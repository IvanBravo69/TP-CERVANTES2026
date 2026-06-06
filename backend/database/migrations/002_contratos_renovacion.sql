-- Agrega trazabilidad de renovaciones: cada contrato renovado referencia al original
ALTER TABLE contratos
  ADD COLUMN contrato_origen_id INT UNSIGNED NULL DEFAULT NULL AFTER observaciones,
  ADD INDEX idx_contrato_origen (contrato_origen_id),
  ADD CONSTRAINT fk_contrato_origen FOREIGN KEY (contrato_origen_id) REFERENCES contratos(id);
