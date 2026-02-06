/**
 * Script para configurar eventos para el usuario principal de Wendy
 */
import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function setup() {
  const userId = 'aJKaLH86nfOfMDCFpIBYkal6ZE22';
  console.log(`Configurando eventos para usuario: ${userId}\n`);

  // 1. Registrar como asistente del evento 23 (con check-in)
  console.log('1. Registrando como asistente del evento 23...');

  const [existing] = await db.execute(sql`
    SELECT id FROM event_attendees
    WHERE event_id = 23 AND user_id = ${userId}::varchar
  `);

  if (existing) {
    console.log('   Ya estaba registrada, actualizando...');
    await db.execute(sql`
      UPDATE event_attendees
      SET status = 'approved',
          checked_in_at = CURRENT_TIMESTAMP - INTERVAL '7 days',
          certificate_url = '/api/v1/events/23/certificate'
      WHERE event_id = 23 AND user_id = ${userId}::varchar
    `);
  } else {
    await db.execute(sql`
      INSERT INTO event_attendees (event_id, user_id, status, registered_at, checked_in_at, certificate_url)
      VALUES (23, ${userId}::varchar, 'approved', CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '7 days', '/api/v1/events/23/certificate')
    `);
  }
  console.log('   OK - Registrada en evento 23 con check-in\n');

  // 2. Verificar
  console.log('2. Verificando resultados...');

  const myEvents = await db.execute(sql`
    SELECT id, title, status FROM events WHERE organizer_id = ${userId}::varchar
  `);
  console.log(`\n   Mis eventos creados: ${myEvents.length}`);
  myEvents.forEach((e: any) => console.log(`     - ID ${e.id}: ${e.title} (${e.status})`));

  const attended = await db.execute(sql`
    SELECT e.id, e.title, ea.status, ea.checked_in_at
    FROM event_attendees ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = ${userId}::varchar
    AND e.organizer_id != ${userId}::varchar
  `);
  console.log(`\n   Eventos asistidos (historial): ${attended.length}`);
  attended.forEach((e: any) => console.log(`     - ID ${e.id}: ${e.title} (check-in: ${e.checked_in_at ? 'Sí' : 'No'})`));

  console.log('\n===========================================');
  console.log('LISTO! Ahora deberías ver:');
  console.log(`- Mis eventos: ${myEvents.length} eventos`);
  console.log(`- Historial: ${attended.length} eventos asistidos`);
  console.log('===========================================\n');

  process.exit(0);
}

setup();
