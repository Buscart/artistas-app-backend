-- Migración para agregar funcionalidades sociales (comentarios, likes, follows, tendencias)
-- Fecha: 2024-12-02

-- Tabla de likes en posts
CREATE TABLE IF NOT EXISTS post_likes (
  post_id INTEGER NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas de likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas de comentarios
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Tabla de likes en comentarios
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id INTEGER NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas de likes en comentarios
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Tabla de follows (seguidores)
CREATE TABLE IF NOT EXISTS follows (
  follower_id VARCHAR(255) NOT NULL,
  following_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (follower_id != following_id)
);

-- Índices para optimizar consultas de follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Tabla de hashtags extraídos de posts
CREATE TABLE IF NOT EXISTS hashtags (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para hashtags
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_use_count ON hashtags(use_count DESC);

-- Tabla de relación posts-hashtags
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
);

-- Índices para post_hashtags
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);

-- Agregar columna metadata a posts si no existe (para guardar información adicional)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Índice para búsqueda en metadata
CREATE INDEX IF NOT EXISTS idx_posts_metadata ON posts USING GIN (metadata);

-- Función para extraer hashtags de un texto
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TABLE (tag VARCHAR(100)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT LOWER(regexp_replace(match[1], '^#', ''))::VARCHAR(100)
  FROM regexp_matches(text_content, '#([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+)', 'g') AS match;
END;
$$ LANGUAGE plpgsql;

-- Función trigger para actualizar hashtags cuando se crea/actualiza un post
CREATE OR REPLACE FUNCTION update_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_record RECORD;
  hashtag_id_val INTEGER;
BEGIN
  -- Eliminar hashtags antiguos si es una actualización
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM post_hashtags WHERE post_id = NEW.id;
  END IF;

  -- Extraer y guardar nuevos hashtags
  FOR hashtag_record IN SELECT * FROM extract_hashtags(NEW.content)
  LOOP
    -- Insertar o actualizar el hashtag
    INSERT INTO hashtags (tag, use_count)
    VALUES (hashtag_record.tag, 1)
    ON CONFLICT (tag)
    DO UPDATE SET
      use_count = hashtags.use_count + 1,
      updated_at = NOW()
    RETURNING id INTO hashtag_id_val;

    -- Relacionar el post con el hashtag
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_id_val)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar hashtags automáticamente
DROP TRIGGER IF EXISTS trigger_update_post_hashtags ON posts;
CREATE TRIGGER trigger_update_post_hashtags
AFTER INSERT OR UPDATE OF content ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_hashtags();

-- Agregar contador de seguidores y seguidos a la tabla users si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Función para actualizar contadores de follows
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador de seguidores del usuario seguido
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Incrementar contador de seguidos del usuario que sigue
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador de seguidores del usuario seguido
    UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    -- Decrementar contador de seguidos del usuario que sigue
    UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores de follows
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON follows;
CREATE TRIGGER trigger_update_follow_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Comentarios útiles
COMMENT ON TABLE post_likes IS 'Almacena los likes de los posts';
COMMENT ON TABLE comments IS 'Almacena los comentarios de los posts con soporte para respuestas anidadas';
COMMENT ON TABLE comment_likes IS 'Almacena los likes de los comentarios';
COMMENT ON TABLE follows IS 'Almacena las relaciones de seguimiento entre usuarios';
COMMENT ON TABLE hashtags IS 'Almacena los hashtags únicos y su frecuencia de uso';
COMMENT ON TABLE post_hashtags IS 'Relación muchos a muchos entre posts y hashtags';
