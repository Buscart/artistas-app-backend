-- Add password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR;

-- Add a comment to the column
COMMENT ON COLUMN users.password IS 'Contraseña hasheada del usuario para autenticación';
