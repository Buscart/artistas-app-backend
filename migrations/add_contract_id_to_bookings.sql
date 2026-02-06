-- Migración: Agregar contractId a la tabla bookings
-- Fecha: 2024-01-31
-- Descripción: Conecta las reservas con los contratos

-- Agregar columna contractId a bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS contract_id INTEGER REFERENCES user_contracts(id) ON DELETE SET NULL;

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_bookings_contract_id ON bookings(contract_id);

-- Comentario
COMMENT ON COLUMN bookings.contract_id IS 'Referencia al contrato generado cuando se confirma la reserva';
