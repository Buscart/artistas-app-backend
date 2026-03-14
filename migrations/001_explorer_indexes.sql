-- Migration: Optimización Explorer - Índices Compuestos
-- Propósito: Eliminar N+1 queries y optimizar búsquedas del explorador

-- Índice compuesto para búsquedas de artistas (más crítico)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_artists_search 
ON artists(category_id, city, price_per_hour, is_available) 
WHERE is_available = true;

-- Índice para usuarios artistas con rating y verificación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_users_artists 
ON users(user_type, rating DESC, is_verified, created_at DESC) 
WHERE user_type = 'artist' AND is_available = true;

-- Índice para búsquedas por texto (artistas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_text_search 
ON artists USING gin(to_tsvector('spanish', 
  COALESCE(artist_type, '') || ' ' || 
  COALESCE(tags::text, '') || ' ' || 
  COALESCE(stage_name, '')
));

-- Índice para eventos futuros por ciudad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_events_city_date 
ON events(city, start_date, status) 
WHERE start_date >= NOW() AND status = 'published';

-- Índice para venues disponibles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_venues_available 
ON venues(city, rating DESC, is_available) 
WHERE is_available = true;

-- Índice para servicios activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_services_active 
ON services(category, price, created_at DESC) 
WHERE is_active = true;

-- Índice para obras disponibles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explorer_artworks_available 
ON artworks(category, city, price, views DESC) 
WHERE show_in_explorer = true AND available = true;

-- Índice para highlight photos (evitar N+1)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_highlight_photos_user_position 
ON highlight_photos(user_id, position) 
WHERE image_url IS NOT NULL;

-- Analizar estadísticas para optimización del query planner
ANALYZE artists;
ANALYZE users;
ANALYZE events;
ANALYZE venues;
ANALYZE services;
ANALYZE artworks;
ANALYZE highlight_photos;
