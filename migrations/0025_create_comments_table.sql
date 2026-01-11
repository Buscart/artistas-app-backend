-- Migración para crear la tabla de comentarios con funcionalidades avanzadas
-- Fecha: 2026-01-11

-- Crear la tabla de comentarios si no existe
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,

  -- Nuevos campos para funcionalidades avanzadas
  images TEXT[] DEFAULT '{}', -- Array de URLs de imágenes
  mentions TEXT[] DEFAULT '{}', -- Array de user IDs mencionados
  tagged_artists INTEGER[] DEFAULT '{}', -- Array de artist IDs etiquetados
  tagged_events INTEGER[] DEFAULT '{}', -- Array de event IDs etiquetados
  poll JSONB, -- Estructura: { question: string, options: string[], votes: { [option]: count } }

  -- Campos de interacción
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  -- Campos de estado
  is_approved BOOLEAN DEFAULT true,
  is_edited BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP
);

-- Crear tabla para los likes de comentarios
CREATE TABLE IF NOT EXISTS comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- Crear tabla para los votos de encuestas en comentarios
CREATE TABLE IF NOT EXISTS comment_poll_votes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL, -- Índice de la opción votada
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id) -- Un usuario solo puede votar una vez por encuesta
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_poll_votes_comment_id ON comment_poll_votes(comment_id);

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Comentarios descriptivos
COMMENT ON TABLE comments IS 'Comentarios en posts con soporte para imágenes, menciones, etiquetas y encuestas';
COMMENT ON COLUMN comments.images IS 'Array de URLs de imágenes adjuntas al comentario';
COMMENT ON COLUMN comments.mentions IS 'Array de user IDs mencionados con @';
COMMENT ON COLUMN comments.tagged_artists IS 'Array de artist IDs etiquetados en el comentario';
COMMENT ON COLUMN comments.tagged_events IS 'Array de event IDs etiquetados en el comentario';
COMMENT ON COLUMN comments.poll IS 'Datos de encuesta en formato JSON';
COMMENT ON TABLE comment_likes IS 'Likes en comentarios';
COMMENT ON TABLE comment_poll_votes IS 'Votos en encuestas de comentarios';
