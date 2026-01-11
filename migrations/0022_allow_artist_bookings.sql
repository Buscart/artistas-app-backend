-- 0022_allow_artist_bookings.sql
-- Permitir que las reservas se asocien directamente a artistas o compañías

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE;

ALTER TABLE bookings
  ALTER COLUMN company_id DROP NOT NULL;

-- Asegurar que al menos uno de los proveedores exista
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS booking_provider_check;

ALTER TABLE bookings
  ADD CONSTRAINT booking_provider_check
  CHECK (
    company_id IS NOT NULL OR artist_id IS NOT NULL
  );
