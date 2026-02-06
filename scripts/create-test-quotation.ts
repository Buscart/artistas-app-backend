import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function createTestQuotation() {
  console.log('Creando cotización de prueba...\n');

  // Primero obtener los usuarios disponibles
  const users = await db.execute(sql`
    SELECT id, first_name, last_name, email
    FROM users
    ORDER BY created_at
    LIMIT 10
  `);

  console.log('Usuarios disponibles:');
  users.forEach((u: any, i: number) => {
    console.log(`${i + 1}. ${u.id} - ${u.first_name} ${u.last_name} (${u.email})`);
  });

  if (users.length < 2) {
    console.error('\n❌ Se necesitan al menos 2 usuarios para crear una cotización de prueba');
    process.exit(1);
  }

  // Buscar a Wendy como artista (destinatario de la cotización)
  // Priorizar el email correcto
  const wendyUser = users.find((u: any) => u.email === 'wendy.nietov@gmail.com') ||
    users.find((u: any) => u.id === 'aJKaLH86nfOfMDCFpIBYkal6ZE22');

  if (!wendyUser) {
    console.error('\n❌ No se encontró el usuario Wendy Nieto');
    process.exit(1);
  }

  // Usar otro usuario como cliente (el que envía la solicitud)
  const clientUser = users.find((u: any) => u.id !== wendyUser.id);
  const artistUser = wendyUser;

  console.log(`\n📝 Creando cotización:`);
  console.log(`   Cliente: ${clientUser.first_name} ${clientUser.last_name} (${clientUser.id})`);
  console.log(`   Artista: ${artistUser.first_name} ${artistUser.last_name} (${artistUser.id})`);

  // Crear la cotización
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);

  const result = await db.execute(sql`
    INSERT INTO user_quotations (
      user_id,
      artist_id,
      service_type,
      title,
      description,
      budget_min,
      budget_max,
      preferred_date,
      location,
      status,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      ${clientUser.id},
      ${artistUser.id},
      'music',
      'Músico para fiesta de cumpleaños',
      'Necesito un músico para animar una fiesta de cumpleaños. Aproximadamente 3 horas de música en vivo. El evento es para 50 personas.',
      150000,
      300000,
      ${tomorrow.toISOString()},
      'Medellín, El Poblado',
      'pending',
      ${expiresAt.toISOString()},
      NOW(),
      NOW()
    )
    RETURNING id, title, status
  `);

  console.log('\n✅ Cotización creada exitosamente!');
  console.log(`   ID: ${(result[0] as any).id}`);
  console.log(`   Título: ${(result[0] as any).title}`);
  console.log(`   Estado: ${(result[0] as any).status}`);

  // Crear otra cotización urgente
  const urgentDate = new Date();
  urgentDate.setHours(urgentDate.getHours() + 12);

  const urgentExpires = new Date();
  urgentExpires.setHours(urgentExpires.getHours() + 24);

  const result2 = await db.execute(sql`
    INSERT INTO user_quotations (
      user_id,
      artist_id,
      service_type,
      title,
      description,
      budget_min,
      budget_max,
      preferred_date,
      location,
      status,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      ${clientUser.id},
      ${artistUser.id},
      'photography',
      'URGENTE: Fotógrafo para evento corporativo',
      'Necesitamos fotógrafo urgente para evento corporativo mañana. Cobertura de 4 horas + entrega de fotos editadas.',
      200000,
      450000,
      ${urgentDate.toISOString()},
      'Bogotá, Zona T',
      'pending',
      ${urgentExpires.toISOString()},
      NOW(),
      NOW()
    )
    RETURNING id, title, status
  `);

  console.log('\n✅ Cotización urgente creada!');
  console.log(`   ID: ${(result2[0] as any).id}`);
  console.log(`   Título: ${(result2[0] as any).title}`);
  console.log(`   Estado: ${(result2[0] as any).status}`);

  console.log('\n🎉 Ahora deberías ver estas ofertas en tu Portal del Artista > Ofertas');

  process.exit(0);
}

createTestQuotation().catch(console.error);
