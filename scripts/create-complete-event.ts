/**
 * Script para crear un evento completo de ejemplo con todos los datos:
 * - Evento con ubicación, capacidad, precio
 * - Agenda del evento
 * - Asistentes registrados y aprobados
 * - Reseñas de asistentes
 *
 * Ejecutar: npx tsx scripts/create-complete-event.ts
 */

import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function createCompletEvent() {
  console.log('=== Creando evento completo de ejemplo ===\n');

  try {
    // 1. Crear las tablas si no existen
    console.log('1. Verificando/creando tablas...');

    // Tabla de reseñas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_reviews (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(100),
        comment TEXT,
        organizer_response TEXT,
        organizer_response_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        is_hidden BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   - Tabla event_reviews OK');

    // Tabla de agenda
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS event_agenda (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        location VARCHAR(200),
        speaker_name VARCHAR(100),
        speaker_title VARCHAR(100),
        speaker_image VARCHAR,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   - Tabla event_agenda OK');

    // Agregar columnas de certificado a event_attendees si no existen
    await db.execute(sql`
      ALTER TABLE event_attendees
      ADD COLUMN IF NOT EXISTS certificate_url VARCHAR,
      ADD COLUMN IF NOT EXISTS certificate_generated_at TIMESTAMP
    `);
    console.log('   - Columnas de certificado agregadas OK');

    // 2. Obtener el usuario organizador (el tuyo)
    const [organizer] = await db.execute(sql`
      SELECT id, display_name, first_name, last_name FROM users LIMIT 1
    `);

    if (!organizer) {
      throw new Error('No hay usuarios en la base de datos');
    }

    const organizerId = (organizer as any).id;
    console.log(`\n2. Organizador: ${(organizer as any).first_name} ${(organizer as any).last_name}`);

    // 3. Crear el evento completo
    console.log('\n3. Creando evento...');

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() - 7); // Evento de hace 1 semana (ya pasó)
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(eventEndDate.getHours() + 4);

    const [newEvent] = await db.execute(sql`
      INSERT INTO events (
        organizer_id,
        title,
        slug,
        description,
        short_description,
        start_date,
        end_date,
        timezone,
        location_type,
        address,
        city,
        state,
        country,
        venue_name,
        venue_description,
        is_free,
        ticket_price,
        capacity,
        available_tickets,
        status,
        is_featured,
        requires_approval,
        enable_waitlist,
        view_count,
        save_count,
        share_count,
        featured_image,
        event_type,
        tags
      ) VALUES (
        ${organizerId},
        'Workshop de Ilustración Digital Avanzada',
        'workshop-ilustracion-digital-avanzada-2025',
        'Un workshop intensivo de 4 horas donde aprenderás técnicas avanzadas de ilustración digital con Procreate y Photoshop. Ideal para artistas que quieren llevar su arte al siguiente nivel.

Durante el taller exploraremos:
- Técnicas de pinceladas y texturas
- Composición y teoría del color
- Flujo de trabajo profesional
- Tips para crear portfolios impactantes

Incluye materiales digitales y acceso a recursos exclusivos.',
        'Workshop intensivo de ilustración digital con técnicas avanzadas de Procreate y Photoshop',
        ${eventDate.toISOString()}::timestamp,
        ${eventEndDate.toISOString()}::timestamp,
        'America/Bogota',
        'physical',
        'Calle 85 #11-53, Oficina 301',
        'Bogotá',
        'Cundinamarca',
        'Colombia',
        'Centro Cultural BuscArt',
        'Espacio moderno con equipos de última generación, aire acondicionado y área de networking',
        false,
        150000,
        30,
        5,
        'completed',
        true,
        false,
        true,
        847,
        156,
        89,
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200',
        'workshop',
        ARRAY['ilustración', 'digital', 'procreate', 'photoshop', 'arte']
      )
      RETURNING id, title
    `);

    const eventId = (newEvent as any).id;
    console.log(`   - Evento creado: ID ${eventId} - ${(newEvent as any).title}`);

    // 4. Crear agenda del evento
    console.log('\n4. Creando agenda del evento...');

    const agendaItems = [
      {
        title: 'Registro y bienvenida',
        description: 'Check-in de participantes, entrega de materiales y networking inicial',
        startTime: new Date(eventDate.getTime()),
        endTime: new Date(eventDate.getTime() + 30 * 60000),
        speakerName: null,
        sortOrder: 1
      },
      {
        title: 'Fundamentos de ilustración digital',
        description: 'Repaso de conceptos básicos y configuración del espacio de trabajo',
        startTime: new Date(eventDate.getTime() + 30 * 60000),
        endTime: new Date(eventDate.getTime() + 90 * 60000),
        speakerName: 'María González',
        speakerTitle: 'Ilustradora Senior',
        sortOrder: 2
      },
      {
        title: 'Coffee Break',
        description: 'Pausa para café y snacks',
        startTime: new Date(eventDate.getTime() + 90 * 60000),
        endTime: new Date(eventDate.getTime() + 105 * 60000),
        speakerName: null,
        sortOrder: 3
      },
      {
        title: 'Técnicas avanzadas de pinceladas',
        description: 'Exploración de brushes personalizados y técnicas de texturizado',
        startTime: new Date(eventDate.getTime() + 105 * 60000),
        endTime: new Date(eventDate.getTime() + 165 * 60000),
        speakerName: 'Carlos Ruiz',
        speakerTitle: 'Concept Artist',
        sortOrder: 4
      },
      {
        title: 'Práctica guiada',
        description: 'Ejercicio práctico supervisado con feedback en tiempo real',
        startTime: new Date(eventDate.getTime() + 165 * 60000),
        endTime: new Date(eventDate.getTime() + 225 * 60000),
        speakerName: 'María González',
        speakerTitle: 'Ilustradora Senior',
        sortOrder: 5
      },
      {
        title: 'Cierre y entrega de certificados',
        description: 'Conclusiones, Q&A final y entrega de certificados de participación',
        startTime: new Date(eventDate.getTime() + 225 * 60000),
        endTime: new Date(eventDate.getTime() + 240 * 60000),
        speakerName: null,
        sortOrder: 6
      }
    ];

    for (const item of agendaItems) {
      await db.execute(sql`
        INSERT INTO event_agenda (
          event_id, title, description, start_time, end_time,
          speaker_name, speaker_title, sort_order
        ) VALUES (
          ${eventId},
          ${item.title},
          ${item.description},
          ${item.startTime.toISOString()}::timestamp,
          ${item.endTime.toISOString()}::timestamp,
          ${item.speakerName},
          ${(item as any).speakerTitle || null},
          ${item.sortOrder}
        )
      `);
    }
    console.log(`   - ${agendaItems.length} items de agenda creados`);

    // 5. Crear asistentes ficticios
    console.log('\n5. Creando asistentes...');

    // Primero crear usuarios ficticios
    const attendeeUsers = [
      { firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@example.com' },
      { firstName: 'Pedro', lastName: 'López', email: 'pedro.lopez@example.com' },
      { firstName: 'Laura', lastName: 'García', email: 'laura.garcia@example.com' },
      { firstName: 'Diego', lastName: 'Hernández', email: 'diego.hernandez@example.com' },
      { firstName: 'Sofía', lastName: 'Rodríguez', email: 'sofia.rodriguez@example.com' },
    ];

    const createdUserIds: string[] = [];

    for (const user of attendeeUsers) {
      const odId = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      try {
        await db.execute(sql`
          INSERT INTO users (id, email, first_name, last_name, display_name, user_type)
          VALUES (
            ${odId},
            ${user.email},
            ${user.firstName},
            ${user.lastName},
            ${user.firstName + ' ' + user.lastName},
            'general'
          )
          ON CONFLICT (email) DO UPDATE SET first_name = ${user.firstName}
          RETURNING id
        `);

        // Obtener el ID real del usuario
        const [existingUser] = await db.execute(sql`
          SELECT id FROM users WHERE email = ${user.email}
        `);
        createdUserIds.push((existingUser as any).id);
      } catch (e) {
        // Si ya existe, obtener el ID
        const [existingUser] = await db.execute(sql`
          SELECT id FROM users WHERE email = ${user.email}
        `);
        if (existingUser) {
          createdUserIds.push((existingUser as any).id);
        }
      }
    }
    console.log(`   - ${createdUserIds.length} usuarios creados/encontrados`);

    // Crear registros de asistentes
    const checkInTime = new Date(eventDate.getTime() + 15 * 60000); // 15 min después del inicio

    for (let i = 0; i < createdUserIds.length; i++) {
      const odUserId = createdUserIds[i];
      const ticketCode = `WIDA2025-${String(i + 1).padStart(3, '0')}`;

      await db.execute(sql`
        INSERT INTO event_attendees (
          event_id, user_id, status, registered_at,
          checked_in_at, certificate_url
        ) VALUES (
          ${eventId},
          ${odUserId},
          'approved',
          ${new Date(eventDate.getTime() - 7 * 24 * 60 * 60000).toISOString()}::timestamp,
          ${checkInTime.toISOString()}::timestamp,
          ${`/api/v1/events/${eventId}/certificate/${odUserId}`}
        )
        ON CONFLICT DO NOTHING
      `);
    }
    console.log(`   - ${createdUserIds.length} asistentes registrados como aprobados y con check-in`);

    // 6. Crear reseñas
    console.log('\n6. Creando reseñas...');

    const reviews = [
      {
        userId: createdUserIds[0],
        rating: 5,
        title: 'Excelente workshop!',
        comment: 'Superó mis expectativas. Los instructores son muy profesionales y las técnicas que aprendí las estoy aplicando en mis proyectos. Muy recomendado!'
      },
      {
        userId: createdUserIds[1],
        rating: 4,
        title: 'Muy bueno, aprendí mucho',
        comment: 'El contenido fue muy útil y bien estructurado. Lo único que mejoraría es dar más tiempo para la práctica, pero en general excelente.'
      },
      {
        userId: createdUserIds[2],
        rating: 5,
        title: 'Increíble experiencia',
        comment: 'El mejor workshop de ilustración al que he asistido. María y Carlos son unos cracks, explican todo de manera muy clara y el ambiente fue muy agradable.'
      },
      {
        userId: createdUserIds[3],
        rating: 4,
        title: 'Valió cada peso',
        comment: 'Contenido de calidad, buenos materiales y excelente atención. Definitivamente asistiré a más eventos de BuscArt.'
      },
      {
        userId: createdUserIds[4],
        rating: 5,
        title: 'Transformó mi forma de trabajar',
        comment: 'Las técnicas de pinceladas que aprendí me han ahorrado horas de trabajo. El certificado también es un plus para mi portfolio. 100% recomendado!'
      }
    ];

    for (const review of reviews) {
      await db.execute(sql`
        INSERT INTO event_reviews (
          event_id, user_id, rating, title, comment, is_verified
        ) VALUES (
          ${eventId},
          ${review.userId},
          ${review.rating},
          ${review.title},
          ${review.comment},
          true
        )
        ON CONFLICT DO NOTHING
      `);
    }
    console.log(`   - ${reviews.length} reseñas creadas`);

    // 7. Actualizar estadísticas del evento
    console.log('\n7. Actualizando estadísticas del evento...');

    // Calcular rating promedio
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await db.execute(sql`
      UPDATE events SET
        available_tickets = capacity - ${createdUserIds.length}
      WHERE id = ${eventId}
    `);
    console.log(`   - Estadísticas actualizadas (Rating promedio: ${avgRating.toFixed(1)})`);

    // Registrar también al usuario principal como asistente de otro evento
    // para probar el historial
    console.log('\n8. Registrando al usuario principal en otro evento (historial)...');

    // Verificar si hay otros eventos
    const [otherEvent] = await db.execute(sql`
      SELECT id, title FROM events
      WHERE organizer_id != ${organizerId}
      AND id != ${eventId}
      LIMIT 1
    `);

    if (otherEvent) {
      await db.execute(sql`
        INSERT INTO event_attendees (event_id, user_id, status, checked_in_at)
        VALUES (
          ${(otherEvent as any).id},
          ${organizerId},
          'approved',
          CURRENT_TIMESTAMP - INTERVAL '14 days'
        )
        ON CONFLICT DO NOTHING
      `);
      console.log(`   - Usuario registrado en: ${(otherEvent as any).title}`);
    } else {
      console.log('   - No hay otros eventos disponibles para historial');
    }

    console.log('\n===========================================');
    console.log('EVENTO CREADO EXITOSAMENTE!');
    console.log('===========================================');
    console.log(`\nID del evento: ${eventId}`);
    console.log(`Título: Workshop de Ilustración Digital Avanzada`);
    console.log(`Asistentes: ${createdUserIds.length}`);
    console.log(`Reseñas: ${reviews.length}`);
    console.log(`Rating promedio: ${avgRating.toFixed(1)}/5`);
    console.log(`\nPuedes ver el evento en: /events/${eventId}`);
    console.log('===========================================\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  process.exit(0);
}

createCompletEvent();
