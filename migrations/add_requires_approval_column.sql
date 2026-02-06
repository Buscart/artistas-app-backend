-- Agregar columna requires_approval a la tabla events
ALTER TABLE events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- Agregar columna enable_waitlist a la tabla events (si no existe)
ALTER TABLE events ADD COLUMN IF NOT EXISTS enable_waitlist BOOLEAN DEFAULT FALSE;

-- Agregar columna waitlist_capacity a la tabla events (si no existe)
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_capacity INTEGER;

-- Agregar columna registration_deadline a la tabla events (si no existe)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP;
