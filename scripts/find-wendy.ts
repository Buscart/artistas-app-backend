import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function findWendy() {
  console.log('Buscando todos los usuarios con "wendy" o IDs específicos...\n');

  const users = await db.execute(sql`
    SELECT id, first_name, last_name, email, created_at
    FROM users
    WHERE first_name ILIKE '%wendy%'
       OR last_name ILIKE '%wendy%'
       OR email ILIKE '%wendy%'
       OR id LIKE 'aJKaLH%'
       OR id LIKE 'OWhVym%'
    ORDER BY created_at
  `);

  console.log(`Encontrados: ${users.length} usuarios\n`);
  users.forEach((u: any) => {
    console.log(`ID: ${u.id}`);
    console.log(`Nombre: ${u.first_name} ${u.last_name}`);
    console.log(`Email: ${u.email}`);
    console.log(`Creado: ${u.created_at}`);
    console.log('---');
  });

  // Verificar eventos del usuario OWhVym4jUUgwjdhgnIZ7hgHkB7H3
  console.log('\n\nEventos del usuario OWhVym4jUUgwjdhgnIZ7hgHkB7H3:');
  const events = await db.execute(sql`
    SELECT id, title, status FROM events WHERE organizer_id = 'OWhVym4jUUgwjdhgnIZ7hgHkB7H3'
  `);
  events.forEach((e: any) => console.log(`  - ${e.id}: ${e.title} (${e.status})`));

  console.log('\n\nAsistencias del usuario OWhVym4jUUgwjdhgnIZ7hgHkB7H3:');
  const attendances = await db.execute(sql`
    SELECT e.id, e.title, ea.status, ea.checked_in_at
    FROM event_attendees ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = 'OWhVym4jUUgwjdhgnIZ7hgHkB7H3'
  `);
  attendances.forEach((a: any) => console.log(`  - ${a.id}: ${a.title} (${a.status}, check-in: ${a.checked_in_at ? 'Sí' : 'No'})`));

  // También verificar el otro usuario aJKaLH86nfOfMDCFpIBYkal6ZE22
  console.log('\n\nEventos del usuario aJKaLH86nfOfMDCFpIBYkal6ZE22:');
  const events2 = await db.execute(sql`
    SELECT id, title, status FROM events WHERE organizer_id = 'aJKaLH86nfOfMDCFpIBYkal6ZE22'
  `);
  events2.forEach((e: any) => console.log(`  - ${e.id}: ${e.title} (${e.status})`));

  process.exit(0);
}

findWendy();
