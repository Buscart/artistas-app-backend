// database/migrations/add_verification_fields.sql
// Migración para agregar campos de verificación a la tabla artists

ALTER TABLE artists ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS verification_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS verification_documents JSON;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP NULL;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMP NULL;

-- Actualizar artistas existentes
UPDATE artists SET verification_status = 'none' WHERE verification_status IS NULL;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_artists_verification_status ON artists(verification_status);
CREATE INDEX idx_artists_verified ON artists(verified);

-- Insertar configuración por defecto para verificación
INSERT IGNORE INTO platform_config (key, value, description) VALUES 
('verification_enabled', 'true', 'Habilitar sistema de verificación de artistas'),
('verification_required_documents', '["id_card", "portfolio", "social_media"]', 'Documentos requeridos para verificación'),
('verification_auto_approve', 'false', 'Aprobar automáticamente solicitudes de verificación');
