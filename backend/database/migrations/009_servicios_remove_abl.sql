ALTER TABLE servicios
  MODIFY COLUMN tipo ENUM('Luz','Gas','Agua','Expensas','Municipal','Otro') NOT NULL;
