-- Agregar campo para compartir posts en mensajes
ALTER TABLE messages
ADD COLUMN shared_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;

-- Índice para búsquedas eficientes
CREATE INDEX idx_messages_shared_post_id ON messages(shared_post_id);

-- Comentario
COMMENT ON COLUMN messages.shared_post_id IS 'ID del post compartido en el mensaje (opcional)';
