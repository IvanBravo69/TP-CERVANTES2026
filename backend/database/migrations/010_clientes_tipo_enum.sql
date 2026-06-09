-- Actualizar tipo de clientes: Persona/Empresa → Inquilino/Propietario
ALTER TABLE clientes
  MODIFY COLUMN tipo ENUM('Inquilino','Propietario') NOT NULL DEFAULT 'Inquilino';

-- Migrar datos existentes si los hubiera
UPDATE clientes SET tipo = 'Inquilino'   WHERE tipo NOT IN ('Inquilino','Propietario');
