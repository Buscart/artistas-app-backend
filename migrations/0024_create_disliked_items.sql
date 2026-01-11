-- Migration: Create disliked_items table
-- Esta tabla almacena los items que el usuario marcó como "no me interesa"
-- para mejorar las recomendaciones

CREATE TABLE IF NOT EXISTS disliked_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL,
  entity_type VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Índice único para evitar duplicados
  UNIQUE(user_id, entity_id, entity_type)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_disliked_items_user_id ON disliked_items(user_id);
CREATE INDEX IF NOT EXISTS idx_disliked_items_entity ON disliked_items(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_disliked_items_created_at ON disliked_items(created_at);

-- Comentarios
COMMENT ON TABLE disliked_items IS 'Almacena los items que el usuario marcó como "no me interesa"';
COMMENT ON COLUMN disliked_items.entity_type IS 'Tipo de entidad: artist, event, venue, gallery';
COMMENT ON COLUMN disliked_items.entity_id IS 'ID de la entidad rechazada';
