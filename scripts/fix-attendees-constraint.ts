import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function fixAttendeesConstraint() {
  try {
    console.log('🔄 Actualizando constraint de status en event_attendees...');
    
    // Eliminar el constraint actual
    await db.execute(sql`
      ALTER TABLE event_attendees 
      DROP CONSTRAINT IF EXISTS event_attendees_status_check
    `);
    
    // Crear nuevo constraint con todos los estados válidos
    await db.execute(sql`
      ALTER TABLE event_attendees 
      ADD CONSTRAINT event_attendees_status_check 
      CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'registered', 'checked_in', 'no_show', 'cancelled'))
    `);
    
    console.log('✅ Constraint actualizado correctamente');
    
    // Ahora crear el asistente de prueba
    console.log('🔄 Creando asistente de prueba...');
    
    await db.execute(sql`
      INSERT INTO event_attendees (event_id, user_id, status, registered_at, created_at)
      VALUES (1, 'aJKaLH86nfOfMDCFpIBYkal6ZE22', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    console.log('✅ Asistente de prueba creado correctamente');
    
    // Verificar los asistentes del evento
    const result = await db.execute(sql`
      SELECT id, user_id, status, registered_at 
      FROM event_attendees 
      WHERE event_id = 1
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log('📊 Asistentes del evento:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAttendeesConstraint();
