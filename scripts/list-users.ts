import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function listUsers() {
  const users = await db.execute(sql`
    SELECT id, first_name, last_name, email
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `);

  console.log('Usuarios en la base de datos:');
  users.forEach((u: any) => {
    console.log(`  - ${u.id}: ${u.first_name} ${u.last_name} (${u.email})`);
  });
  process.exit(0);
}

listUsers();
