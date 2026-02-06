/**
 * Script para configurar eventos para el usuario actual:
 * 1. Buscar el usuario de Wendy
 * 2. Crear un evento para ella (aparecerá en "Mis eventos")
 * 3. Registrarla como asistente en el evento 23 (aparecerá en "Historial")
 *
 * Ejecutar: npx tsx scripts/setup-user-events.ts
 */

import { db } from '../src/db.js';
import { sql, eq } from 'drizzle-orm';

async function setupUserEvents() {
  console.log('=== Configurando eventos para el usuario ===\n');

  try {
    // 1. Buscar el usuario de Wendy
    console.log('1. Buscando usuario...');
    const users = await db.execute(sql`
      SELECT id, first_name, last_name, email, display_name
      FROM users
      WHERE first_name ILIKE '%wendy%'
         OR email ILIKE '%wendy%'
         OR id LIKE '%aJKaLH%'
      LIMIT 5
    `);

    console.log('Usuarios encontrados:', users.length);

    if (users.length === 0) {
      // Si no encontramos a Wendy, buscar cualquier usuario
      const anyUser = await db.execute(sql`
        SELECT id, first_name, last_name, email FROM users LIMIT 5
      `);
      console.log('Usuarios disponibles:');
      anyUser.forEach((u: any) => {
        console.log(`  - ${u.id}: ${u.first_name} ${u.last_name} (${u.email})`);
      });
      throw new Error('No se encontró el usuario. Por favor revisa los IDs arriba.');
    }

    const wendyUser = users[0] as any;
    console.log(`   Usuario encontrado: ${wendyUser.first_name} ${wendyUser.last_name} (${wendyUser.id})`);

    // 2. Crear un evento nuevo para Wendy
    console.log('\n2. Creando evento para el usuario...');

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 14); // Evento en 2 semanas
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(eventEndDate.getHours() + 3);
    const slug = `taller-arte-digital-principiantes-${Date.now()}`;

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
        country,
        venue_name,
        is_free,
        capacity,
        available_tickets,
        status,
        requires_approval,
        enable_waitlist,
        view_count,
        featured_image,
        event_type,
        tags
      ) VALUES (
        ${wendyUser.id}::varchar,
        'Taller de Arte Digital para Principiantes',
        ${slug}::varchar,
        'Un taller introductorio al mundo del arte digital. Aprenderás los fundamentos de la ilustración digital, uso de tabletas gráficas y herramientas básicas de Procreate.',
        'Taller introductorio de arte digital con Procreate',
        ${eventDate.toISOString()}::timestamp,
        ${eventEndDate.toISOString()}::timestamp,
        'America/Bogota',
        'physical',
        'Carrera 15 #93-75',
        'Bogotá',
        'Colombia',
        'Studio BuscArt',
        true,
        20,
        20,
        'published',
        false,
        false,
        45,
        'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200',
        'workshop',
        ARRAY['arte digital', 'principiantes', 'procreate', 'taller']
      )
      RETURNING id, title
    `);

    console.log(`   Evento creado: ID ${(newEvent as any).id} - ${(newEvent as any).title}`);

    // 3. Registrar a Wendy como asistente del evento 23 (con check-in para que aparezca en historial)
    console.log('\n3. Registrando usuario como asistente del evento 23...');

    // Verificar si ya está registrada
    const [existing] = await db.execute(sql`
      SELECT id FROM event_attendees
      WHERE event_id = 23 AND user_id = ${wendyUser.id}
    `);

    if (existing) {
      console.log('   Ya estaba registrada, actualizando estado...');
      await db.execute(sql`
        UPDATE event_attendees
        SET status = 'approved',
            checked_in_at = CURRENT_TIMESTAMP - INTERVAL '7 days',
            certificate_url = '/api/v1/events/23/certificate'
        WHERE event_id = 23 AND user_id = ${wendyUser.id}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO event_attendees (
          event_id,
          user_id,
          status,
          registered_at,
          checked_in_at,
          certificate_url
        ) VALUES (
          23,
          ${wendyUser.id},
          'approved',
          CURRENT_TIMESTAMP - INTERVAL '14 days',
          CURRENT_TIMESTAMP - INTERVAL '7 days',
          '/api/v1/events/23/certificate'
        )
      `);
    }
    console.log('   Registrada como asistente con check-in completado');

    // 4. Verificar los resultados
    console.log('\n4. Verificando resultados...');

    // Eventos creados por el usuario
    const myEvents = await db.execute(sql`
      SELECT id, title, status FROM events WHERE organizer_id = ${wendyUser.id}
    `);
    console.log(`   Eventos creados por ${wendyUser.first_name}: ${myEvents.length}`);
    myEvents.forEach((e: any) => {
      console.log(`     - ID ${e.id}: ${e.title} (${e.status})`);
    });

    // Eventos donde asistió
    const attendedEvents = await db.execute(sql`
      SELECT e.id, e.title, ea.status, ea.checked_in_at
      FROM event_attendees ea
      JOIN events e ON ea.event_id = e.id
      WHERE ea.user_id = ${wendyUser.id}
      AND e.organizer_id != ${wendyUser.id}
    `);
    console.log(`\n   Eventos asistidos por ${wendyUser.first_name}: ${attendedEvents.length}`);
    attendedEvents.forEach((e: any) => {
      console.log(`     - ID ${e.id}: ${e.title} (${e.status}, check-in: ${e.checked_in_at ? 'Sí' : 'No'})`);
    });

    console.log('\n===========================================');
    console.log('CONFIGURACIÓN COMPLETADA!');
    console.log('===========================================');
    console.log(`\nUsuario: ${wendyUser.first_name} ${wendyUser.last_name}`);
    console.log(`ID: ${wendyUser.id}`);
    console.log(`\nEventos creados: ${myEvents.length}`);
    console.log(`Eventos asistidos: ${attendedEvents.length}`);
    console.log('\nAhora deberías ver:');
    console.log('- En "Mis eventos": El nuevo taller de arte digital');
    console.log('- En "Historial": El Workshop de Ilustración Digital (evento 23)');
    console.log('===========================================\n');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  process.exit(0);
}

setupUserEvents();
