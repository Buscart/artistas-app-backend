-- Migration: Populate Events
-- Description: Adds sample cultural events in Colombia
-- Author: Claude
-- Date: 2025-01-19

-- ============================================
-- CREAR USUARIO DEMO PARA EVENTOS
-- ============================================

-- Usuario organizador de eventos
INSERT INTO users (id, email, first_name, last_name, display_name, user_type, created_at, updated_at)
VALUES ('demo_event_organizer', 'events@buscartpro.com', 'Eventos', 'BuscartPro', 'BuscartPro Eventos', 'company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREAR EMPRESA DEMO PARA EVENTOS
-- ============================================

INSERT INTO companies (id, user_id, company_name, company_type, description, city, created_at, updated_at)
VALUES (998, 'demo_event_organizer', 'BuscartPro Eventos', 'venue', 'Empresa organizadora de eventos culturales', 'Bogotá', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSERTAR EVENTOS CULTURALES EN COLOMBIA
-- ============================================

INSERT INTO events (
  organizer_id,
  company_id,
  title,
  slug,
  description,
  short_description,
  event_type,
  category_id,
  tags,
  start_date,
  end_date,
  timezone,
  location_type,
  address,
  city,
  state,
  country,
  coordinates,
  venue_name,
  venue_capacity,
  is_outdoor,
  is_free,
  ticket_price,
  status,
  featured_image,
  gallery,
  created_at,
  updated_at
) VALUES

-- 1. Concierto de Rock - Bogotá
(
  'demo_event_organizer',
  998,
  'Rock al Parque 2025',
  'rock-al-parque-2025',
  'El festival de rock más importante de América Latina regresa con bandas nacionales e internacionales. Tres días de música en vivo, arte urbano y cultura juvenil en el corazón de Bogotá.',
  'Festival de rock con bandas nacionales e internacionales',
  'concert',
  NULL,
  ARRAY['rock', 'música', 'festival', 'gratis', 'al aire libre'],
  '2026-07-18 14:00:00',
  '2026-07-20 23:00:00',
  'America/Bogota',
  'physical',
  'Parque Simón Bolívar',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '{"lat": 4.6565, "lng": -74.0924}'::jsonb,
  'Parque Simón Bolívar',
  50000,
  true,
  true,
  0,
  'published',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 2. Festival de Jazz - Medellín
(
  'demo_event_organizer',
  998,
  'Festival Internacional de Jazz de Medellín',
  'festival-jazz-medellin-2025',
  'El festival de jazz más importante de Colombia presenta artistas de talla mundial en el Teatro Metropolitano. Una noche mágica con los mejores exponentes del jazz contemporáneo y tradicional.',
  'Noche de jazz con artistas internacionales',
  'concert',
  NULL,
  ARRAY['jazz', 'música', 'concierto', 'internacional'],
  '2026-08-15 20:00:00',
  '2026-08-15 23:30:00',
  'America/Bogota',
  'physical',
  'Teatro Metropolitano José Gutiérrez Gómez',
  'Medellín',
  'Antioquia',
  'Colombia',
  '{"lat": 6.2518, "lng": -75.5636}'::jsonb,
  'Teatro Metropolitano',
  1500,
  false,
  false,
  85000,
  'published',
  'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 3. Exposición de Arte Contemporáneo - Bogotá
(
  'demo_event_organizer',
  998,
  'Bienal de Arte Contemporáneo',
  'bienal-arte-contemporaneo-2025',
  'Exposición de arte contemporáneo con obras de más de 50 artistas colombianos y latinoamericanos. Pinturas, esculturas, instalaciones y arte digital que exploran las realidades sociales actuales.',
  'Exposición con 50+ artistas contemporáneos',
  'exhibition',
  NULL,
  ARRAY['arte', 'exposición', 'contemporáneo', 'galería', 'cultura'],
  '2026-09-01 10:00:00',
  '2026-10-31 18:00:00',
  'America/Bogota',
  'physical',
  'Museo de Arte Moderno de Bogotá',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '{"lat": 4.6097, "lng": -74.0710}'::jsonb,
  'MAMBO',
  200,
  false,
  false,
  25000,
  'published',
  'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 4. Festival de Cine - Cartagena
(
  'demo_event_organizer',
  998,
  'Festival Internacional de Cine de Cartagena',
  'ficci-cartagena-2025',
  'El festival de cine más antiguo de América Latina presenta lo mejor del cine iberoamericano. Proyecciones, talleres con directores reconocidos y premiación de las mejores películas del año.',
  'El festival de cine más importante de Latinoamérica',
  'festival',
  NULL,
  ARRAY['cine', 'festival', 'internacional', 'cultura', 'películas'],
  '2026-03-01 18:00:00',
  '2026-03-08 22:00:00',
  'America/Bogota',
  'physical',
  'Centro de Convenciones Cartagena de Indias',
  'Cartagena',
  'Bolívar',
  'Colombia',
  '{"lat": 10.3910, "lng": -75.4794}'::jsonb,
  'Centro de Convenciones',
  800,
  false,
  false,
  45000,
  'published',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1574267432644-f909c8569a0b?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 5. Feria del Libro - Bogotá
(
  'demo_event_organizer',
  998,
  'Feria Internacional del Libro de Bogotá',
  'filbo-2025',
  'La feria del libro más grande de Colombia reúne editoriales, autores y lectores de todo el mundo. Presentaciones, firmas de libros, charlas con escritores y actividades para toda la familia.',
  'La feria del libro más grande de Colombia',
  'festival',
  NULL,
  ARRAY['libros', 'literatura', 'feria', 'cultura', 'lectura'],
  '2026-04-23 09:00:00',
  '2026-05-06 20:00:00',
  'America/Bogota',
  'physical',
  'Corferias - Centro de Convenciones',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '{"lat": 4.6410, "lng": -74.1075}'::jsonb,
  'Corferias',
  5000,
  false,
  true,
  0,
  'published',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 6. Obra de Teatro - Bogotá
(
  'demo_event_organizer',
  998,
  'Hamlet - Teatro Nacional',
  'hamlet-teatro-nacional',
  'Clásico de Shakespeare adaptado por el Teatro Nacional de Colombia. Una puesta en escena innovadora que combina teatro clásico con elementos contemporáneos y tecnología multimedia.',
  'Shakespeare en versión contemporánea',
  'theater',
  NULL,
  ARRAY['teatro', 'shakespeare', 'drama', 'clásico', 'cultura'],
  '2026-06-10 19:30:00',
  '2026-06-10 22:00:00',
  'America/Bogota',
  'physical',
  'Teatro Colón',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '{"lat": 4.5981, "lng": -74.0758}'::jsonb,
  'Teatro Colón',
  900,
  false,
  false,
  60000,
  'published',
  'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 7. Festival de Salsa - Cali
(
  'demo_event_organizer',
  998,
  'Festival Mundial de Salsa',
  'festival-mundial-salsa-cali-2025',
  'Cali, la capital mundial de la salsa, celebra su festival anual con competencias internacionales, shows en vivo y las mejores orquestas del género. Tres días de ritmo, color y sabor caribeño.',
  'Competencia internacional de salsa en Cali',
  'festival',
  NULL,
  ARRAY['salsa', 'baile', 'música', 'festival', 'competencia'],
  '2026-09-25 15:00:00',
  '2026-09-28 02:00:00',
  'America/Bogota',
  'physical',
  'Plaza de Toros Cañaveralejo',
  'Cali',
  'Valle del Cauca',
  'Colombia',
  '{"lat": 3.4372, "lng": -76.5225}'::jsonb,
  'Plaza de Toros',
  8000,
  false,
  false,
  95000,
  'published',
  'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1445346366695-5bf62de05412?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 8. Taller de Fotografía - Medellín
(
  'demo_event_organizer',
  998,
  'Taller Intensivo de Fotografía Urbana',
  'taller-fotografia-urbana-medellin',
  'Aprende técnicas de fotografía urbana con el reconocido fotógrafo Juan Arboleda. Incluye sesiones teóricas, salidas fotográficas por la ciudad y revisión de portafolio. Cupo limitado a 20 personas.',
  'Taller con fotógrafo profesional en Medellín',
  'workshop',
  NULL,
  ARRAY['fotografía', 'taller', 'urbano', 'educación', 'arte'],
  '2026-05-17 09:00:00',
  '2026-05-18 17:00:00',
  'America/Bogota',
  'physical',
  'Parque Explora',
  'Medellín',
  'Antioquia',
  'Colombia',
  '{"lat": 6.2686, "lng": -75.5685}'::jsonb,
  'Parque Explora',
  20,
  false,
  false,
  180000,
  'published',
  'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 9. Concierto Sinfónico - Bogotá
(
  'demo_event_organizer',
  998,
  'Orquesta Filarmónica de Bogotá: Beethoven',
  'filarmonica-bogota-beethoven',
  'La Orquesta Filarmónica de Bogotá interpreta las sinfonías más emblemáticas de Beethoven. Una noche de música clásica con el director invitado Maestro Gustavo Dudamel.',
  'Sinfonías de Beethoven con director invitado',
  'concert',
  NULL,
  ARRAY['música clásica', 'orquesta', 'beethoven', 'concierto', 'sinfónico'],
  '2026-11-22 20:00:00',
  '2026-11-22 22:30:00',
  'America/Bogota',
  'physical',
  'Teatro Mayor Julio Mario Santo Domingo',
  'Bogotá',
  'Cundinamarca',
  'Colombia',
  '{"lat": 4.7506, "lng": -74.0587}'::jsonb,
  'Teatro Mayor',
  1300,
  false,
  false,
  120000,
  'published',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
),

-- 10. Festival de Danza - Cali
(
  'demo_event_organizer',
  998,
  'Festival Internacional de Danza Contemporánea',
  'festival-danza-contemporanea-cali',
  'Compañías de danza de 15 países se reúnen en Cali para presentar lo mejor de la danza contemporánea. Incluye presentaciones, talleres abiertos y conferencias sobre técnicas de movimiento.',
  'Danza contemporánea con compañías internacionales',
  'festival',
  NULL,
  ARRAY['danza', 'contemporáneo', 'festival', 'internacional', 'arte'],
  '2026-10-10 16:00:00',
  '2026-10-17 22:00:00',
  'America/Bogota',
  'physical',
  'Teatro Municipal Enrique Buenaventura',
  'Cali',
  'Valle del Cauca',
  'Colombia',
  '{"lat": 3.4516, "lng": -76.5320}'::jsonb,
  'Teatro Municipal',
  600,
  false,
  false,
  55000,
  'published',
  'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1200&h=800&fit=crop',
  '["https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&h=600&fit=crop"]'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- Comentarios de documentación
-- ============================================

COMMENT ON TABLE events IS 'Actualizado con 10 eventos culturales de ejemplo en Colombia';

-- Mostrar resumen
DO $$
BEGIN
  RAISE NOTICE 'Se han insertado 10 eventos culturales de ejemplo';
  RAISE NOTICE 'Sistema de eventos listo para usar';
END $$;
