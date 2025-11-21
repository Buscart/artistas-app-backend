-- Migration: Populate Venues and Products
-- Description: Adds real venues from Colombia and sample products for the gallery
-- Author: Claude
-- Date: 2025-01-19

-- ============================================
-- CREAR USUARIOS DEMO
-- ============================================

-- Usuario para empresa de venues
INSERT INTO users (id, email, first_name, last_name, display_name, user_type, created_at, updated_at)
VALUES ('demo_company_owner', 'venues@buscartpro.com', 'Empresa', 'Venues', 'BuscartPro Venues', 'company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Usuario artista para productos
INSERT INTO users (id, email, first_name, last_name, display_name, user_type, created_at, updated_at)
VALUES ('demo_artist_001', 'demo.artist@buscartpro.com', 'Artista', 'Demo', 'Artista Demo', 'artist', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREAR EMPRESA DEMO PARA VENUES
-- ============================================

INSERT INTO companies (id, user_id, company_name, company_type, description, city, created_at, updated_at)
VALUES (999, 'demo_company_owner', 'BuscartPro Venues', 'venue', 'Empresa de gestión de espacios para eventos', 'Bogotá', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSERTAR LUGARES REALES (VENUES) EN COLOMBIA
-- ============================================

INSERT INTO venues (
  name,
  description,
  venue_type,
  address,
  city,
  coordinates,
  capacity,
  services,
  daily_rate,
  is_available,
  multimedia,
  rating,
  total_reviews,
  company_id,
  created_at,
  updated_at
) VALUES
-- 1. Teatro Mayor Julio Mario Santo Domingo - Bogotá
(
  'Teatro Mayor Julio Mario Santo Domingo',
  'Uno de los teatros más importantes de Bogotá, con tecnología de punta y excelente acústica. Ideal para conciertos, obras de teatro, conferencias y eventos corporativos de gran envergadura.',
  'theater',
  'Calle 170 # 67-51',
  'Bogotá',
  '{"lat": 4.7506, "lng": -74.0587}'::jsonb,
  1300,
  ARRAY['Sistema de sonido profesional', 'Iluminación LED', 'Aire acondicionado', 'Camerinos', 'Parqueadero', 'Acceso para discapacitados', 'WiFi', 'Pantallas LED', 'Cafetería'],
  850000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=600&fit=crop"]}'::jsonb,
  4.8,
  124,
  999,
  NOW(),
  NOW()
),

-- 2. Teatro Colón - Bogotá
(
  'Teatro Colón',
  'Teatro histórico inaugurado en 1892, considerado patrimonio cultural de la nación. Arquitectura neoclásica con capacidad para eventos culturales y artísticos de alto nivel.',
  'theater',
  'Calle 10 # 5-32',
  'Bogotá',
  '{"lat": 4.5981, "lng": -74.0758}'::jsonb,
  900,
  ARRAY['Acústica excepcional', 'Arquitectura histórica', 'Iluminación profesional', 'Camerinos', 'Palcos VIP', 'Acceso para discapacitados'],
  750000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop"]}'::jsonb,
  4.9,
  98,
  999,
  NOW(),
  NOW()
),

-- 3. Centro de Eventos Valle del Pacífico - Cali
(
  'Centro de Eventos Valle del Pacífico',
  'Moderno centro de convenciones en Cali, perfecto para eventos corporativos, ferias, exposiciones y congresos. Cuenta con múltiples salas y espacios configurables.',
  'conference_hall',
  'Avenida Pasoancho # 4N-70',
  'Cali',
  '{"lat": 3.3792, "lng": -76.5370}'::jsonb,
  2500,
  ARRAY['Salas modulares', 'WiFi de alta velocidad', 'Proyectores 4K', 'Sistema de sonido', 'Catering', 'Parqueadero amplio', 'Aire acondicionado', 'Traducción simultánea'],
  950000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop"]}'::jsonb,
  4.7,
  156,
  999,
  NOW(),
  NOW()
),

-- 4. Parque Explora - Medellín
(
  'Parque Explora - Auditorio',
  'Espacio interactivo y moderno ubicado en el Parque Explora de Medellín. Ideal para eventos educativos, conferencias científicas, presentaciones y talleres innovadores.',
  'auditorium',
  'Carrera 52 # 73-75',
  'Medellín',
  '{"lat": 6.2686, "lng": -75.5685}'::jsonb,
  400,
  ARRAY['Tecnología audiovisual avanzada', 'WiFi', 'Aire acondicionado', 'Parqueadero', 'Acceso al museo', 'Catering', 'Espacios al aire libre'],
  450000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop"]}'::jsonb,
  4.6,
  87,
  999,
  NOW(),
  NOW()
),

-- 5. La Macarena - Espacio Cultural (Bogotá)
(
  'La Macarena - Espacio Cultural',
  'Espacio íntimo y bohemio en el corazón de La Macarena, Bogotá. Perfecto para eventos culturales, conciertos acústicos, lanzamientos de libros y exposiciones de arte.',
  'cultural_space',
  'Carrera 4A # 26-23',
  'Bogotá',
  '{"lat": 4.6023, "lng": -74.0658}'::jsonb,
  150,
  ARRAY['Ambiente acogedor', 'Sistema de sonido', 'Iluminación ambiental', 'Bar', 'Terraza', 'WiFi', 'Proyector'],
  280000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop"]}'::jsonb,
  4.5,
  72,
  999,
  NOW(),
  NOW()
),

-- 6. Club Campestre El Rancho - Medellín
(
  'Club Campestre El Rancho',
  'Exclusivo club campestre en las afueras de Medellín con amplios jardines, salones elegantes y zonas al aire libre. Ideal para bodas, eventos sociales y corporativos de alto nivel.',
  'banquet_hall',
  'Kilómetro 5 Vía Las Palmas',
  'Medellín',
  '{"lat": 6.1979, "lng": -75.5636}'::jsonb,
  600,
  ARRAY['Jardines amplios', 'Piscina', 'Salones climatizados', 'Catering gourmet', 'Parqueadero valet', 'Decoración incluida', 'Zona infantil', 'Bar premium'],
  1200000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1519167758481-83f29da8fd47?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop"]}'::jsonb,
  4.9,
  215,
  999,
  NOW(),
  NOW()
),

-- 7. Movistar Arena - Bogotá
(
  'Movistar Arena',
  'El coliseo más moderno de Colombia con capacidad para grandes eventos. Tecnología de clase mundial para conciertos, eventos deportivos, shows y convenciones masivas.',
  'arena',
  'Carrera 68C Bis # 25F-85',
  'Bogotá',
  '{"lat": 4.6654, "lng": -74.1082}'::jsonb,
  14000,
  ARRAY['Sistema de sonido de última generación', 'Pantallas gigantes LED', 'Múltiples palcos VIP', 'Restaurantes', 'Parqueadero masivo', 'Seguridad 24/7', 'Acceso metro', 'WiFi'],
  2500000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop"]}'::jsonb,
  4.8,
  342,
  999,
  NOW(),
  NOW()
),

-- 8. Casa Museo Quinta de Bolívar - Bogotá
(
  'Casa Museo Quinta de Bolívar',
  'Histórica casa colonial rodeada de jardines. Espacio único para eventos culturales, lanzamientos institucionales y recepciones elegantes con valor patrimonial.',
  'museum',
  'Calle 20 # 2-91 Este',
  'Bogotá',
  '{"lat": 4.6050, "lng": -74.0547}'::jsonb,
  200,
  ARRAY['Jardines coloniales', 'Arquitectura histórica', 'Catering permitido', 'Guías especializados', 'Parqueadero', 'Fotografía profesional', 'Iluminación ambiental'],
  650000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"]}'::jsonb,
  4.7,
  68,
  999,
  NOW(),
  NOW()
),

-- 9. Jardín Botánico de Bogotá - Pabellón de Eventos
(
  'Jardín Botánico de Bogotá - Pabellón de Eventos',
  'Espacio natural único en medio de la ciudad. Perfecto para eventos al aire libre, bodas eco-friendly, conferencias ambientales y celebraciones rodeadas de naturaleza.',
  'outdoor_venue',
  'Avenida Calle 63 # 68-95',
  'Bogotá',
  '{"lat": 4.6670, "lng": -74.0994}'::jsonb,
  300,
  ARRAY['Entorno natural', 'Jardines temáticos', 'Carpa incluida', 'Mesas y sillas', 'Servicio de catering', 'Fotografía en jardines', 'Acceso guiado', 'Parqueadero'],
  480000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1519167758481-83f29da8fd47?w=800&h=600&fit=crop"]}'::jsonb,
  4.6,
  91,
  999,
  NOW(),
  NOW()
),

-- 10. Hacienda Fagua - Chía (cerca de Bogotá)
(
  'Hacienda Fagua',
  'Hacienda colonial restaurada en las afueras de Bogotá. Ambiente campestre de lujo con caballerizas, capilla, salones elegantes y amplios jardines. Ideal para bodas y eventos exclusivos.',
  'hacienda',
  'Kilómetro 2 Vía Chía - Cajicá',
  'Chía',
  '{"lat": 4.8568, "lng": -74.0167}'::jsonb,
  400,
  ARRAY['Capilla colonial', 'Caballerizas', 'Jardines amplios', 'Salones múltiples', 'Alojamiento', 'Catering gourmet', 'Coordinación de bodas', 'Parqueadero amplio', 'Zona de camping'],
  1500000,
  true,
  '{"images": ["https://images.unsplash.com/photo-1519167758481-83f29da8fd47?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop"]}'::jsonb,
  5.0,
  178,
  999,
  NOW(),
  NOW()
);

-- ============================================
-- INSERTAR PRODUCTOS PARA LA GALERÍA
-- ============================================

-- Productos de Arte
INSERT INTO artworks (
  user_id,
  name,
  description,
  category,
  dimensions,
  price,
  year,
  available,
  images,
  tags,
  city,
  created_at,
  updated_at
) VALUES
-- Arte Digital
(
  'demo_artist_001',
  'Aurora Digital',
  'Obra de arte digital abstracta que combina colores vibrantes y formas geométricas para crear una experiencia visual única. Perfecta para espacios modernos.',
  'Digital Art',
  '2400x3600 px',
  450000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&h=600&fit=crop'],
  ARRAY['arte digital', 'abstracto', 'moderno', 'colorido'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Fotografía
(
  'demo_artist_001',
  'Amanecer en Los Andes',
  'Fotografía de paisaje capturada en las montañas de Colombia. Impresión en papel fotográfico de alta calidad, edición limitada de 50 copias.',
  'Photography',
  '60x90 cm',
  850000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
  ARRAY['fotografía', 'paisaje', 'naturaleza', 'colombia'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Pintura
(
  'demo_artist_001',
  'Rostros de Bogotá',
  'Pintura al óleo que captura la diversidad y expresión de las personas que habitan la capital. Técnica mixta sobre lienzo.',
  'Painting',
  '80x100 cm',
  2500000,
  2023,
  true,
  ARRAY['https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=600&fit=crop'],
  ARRAY['pintura', 'óleo', 'retrato', 'colombia'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Escultura
(
  'demo_artist_001',
  'Equilibrio',
  'Escultura contemporánea en bronce que explora el balance y la armonía. Pieza única firmada por el artista.',
  'Sculpture',
  '45x30x30 cm',
  4200000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1566305977571-5666677c6e98?w=800&h=600&fit=crop'],
  ARRAY['escultura', 'bronce', 'contemporáneo', 'único'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Ilustración
(
  'demo_artist_001',
  'Flora Colombiana',
  'Serie de ilustraciones botánicas de plantas nativas de Colombia. Técnica mixta con acuarela y tinta china. Set de 3 ilustraciones.',
  'Illustration',
  '30x40 cm c/u',
  680000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'],
  ARRAY['ilustración', 'botánica', 'acuarela', 'colombia', 'set'],
  'Medellín',
  NOW(),
  NOW()
),

-- Arte Urbano
(
  'demo_artist_001',
  'Graffiti Resistance',
  'Obra de arte urbano sobre lienzo. Técnica de aerosol con acabados acrílicos. Pieza de gran formato para colecciones contemporáneas.',
  'Urban Art',
  '120x200 cm',
  3800000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=600&fit=crop'],
  ARRAY['graffiti', 'urbano', 'contemporáneo', 'gran formato'],
  'Medellín',
  NOW(),
  NOW()
),

-- Fotografía Documental
(
  'demo_artist_001',
  'Memorias del Café',
  'Serie fotográfica documental sobre la cultura cafetera en Colombia. 10 fotografías de edición limitada (25 copias c/u).',
  'Photography',
  '50x70 cm c/u',
  1200000,
  2023,
  true,
  ARRAY['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'],
  ARRAY['fotografía', 'documental', 'café', 'colombia', 'serie'],
  'Cali',
  NOW(),
  NOW()
),

-- Arte Textil
(
  'demo_artist_001',
  'Tejiendo Identidades',
  'Tapiz tejido a mano con técnicas tradicionales colombianas. Lana de oveja y tintes naturales. Obra única.',
  'Textile Art',
  '100x150 cm',
  1850000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800&h=600&fit=crop'],
  ARRAY['textil', 'tejido', 'artesanal', 'tradicional', 'único'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Arte Conceptual
(
  'demo_artist_001',
  'Silencio Digital',
  'Instalación de arte conceptual que explora la desconexión en la era digital. Incluye componentes electrónicos interactivos.',
  'Conceptual Art',
  'Variable',
  5500000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop'],
  ARRAY['conceptual', 'instalación', 'interactivo', 'digital'],
  'Bogotá',
  NOW(),
  NOW()
),

-- Cerámica
(
  'demo_artist_001',
  'Vasijas Ancestrales',
  'Colección de vasijas de cerámica inspiradas en culturas precolombinas. Técnica de torno y quema en horno de leña. Set de 5 piezas.',
  'Ceramics',
  'Variadas',
  950000,
  2024,
  true,
  ARRAY['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&h=600&fit=crop'],
  ARRAY['cerámica', 'artesanal', 'ancestral', 'set'],
  'Cali',
  NOW(),
  NOW()
);

-- ============================================
-- Actualizar estadísticas de venues
-- ============================================

-- Función para actualizar el conteo de reviews (opcional)
UPDATE venues SET total_reviews = FLOOR(RANDOM() * 200 + 50) WHERE total_reviews IS NULL;
UPDATE venues SET rating = ROUND((RANDOM() * 1.5 + 3.5)::numeric, 1) WHERE rating IS NULL;

-- ============================================
-- Comentarios de documentación
-- ============================================

COMMENT ON TABLE venues IS 'Actualizado con 10 lugares reales de Colombia para sistema de reservas';
COMMENT ON TABLE artworks IS 'Actualizado con 10 productos de arte para la galería';

-- Mostrar resumen
DO $$
BEGIN
  RAISE NOTICE 'Se han insertado 10 venues (lugares reales en Colombia)';
  RAISE NOTICE 'Se han insertado 10 productos de arte para la galería';
  RAISE NOTICE 'Sistema de reservas listo para usar';
END $$;
