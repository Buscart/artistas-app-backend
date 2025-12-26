-- Migración: Crear tabla de colaboraciones entre artistas
-- Fecha: 2025-01-26

CREATE TABLE IF NOT EXISTS collaborations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información de la colaboración
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  collaboration_type VARCHAR CHECK (collaboration_type IN ('musician', 'producer', 'composer', 'choreographer', 'other')) NOT NULL,

  -- Detalles
  genre VARCHAR,
  skills TEXT, -- JSON string de habilidades requeridas
  budget VARCHAR,
  deadline TIMESTAMP,

  -- Estado
  status VARCHAR CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',

  -- Metadata
  response_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX idx_collaborations_status ON collaborations(status);
CREATE INDEX idx_collaborations_collaboration_type ON collaborations(collaboration_type);
CREATE INDEX idx_collaborations_created_at ON collaborations(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collaborations_updated_at
BEFORE UPDATE ON collaborations
FOR EACH ROW
EXECUTE FUNCTION update_collaborations_updated_at();

-- Comentarios
COMMENT ON TABLE collaborations IS 'Tabla para gestionar solicitudes de colaboración entre artistas';
COMMENT ON COLUMN collaborations.collaboration_type IS 'Tipo de colaboración solicitada';
COMMENT ON COLUMN collaborations.status IS 'Estado actual de la solicitud de colaboración';
