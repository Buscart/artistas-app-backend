import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function fixAttendeesColumns() {
  try {
    console.log('🔄 Corrigiendo columnas de event_attendees...');
    
    // Hacer que purchase_id sea nullable
    await db.execute(sql`
      ALTER TABLE event_attendees 
      ALTER COLUMN purchase_id DROP NOT NULL
    `);
    
    // Hacer que ticket_type_id sea nullable
    await db.execute(sql`
      ALTER TABLE event_attendees 
      ALTER COLUMN ticket_type_id DROP NOT NULL
    `);
    
    console.log('✅ Columnas corregidas correctamente');
    
    // Ahora crear el asistente de prueba
    console.log('🔄 Creando asistente de prueba...');
    
    await db.execute(sql`
      INSERT INTO event_attendees (event_id, user_id, status, registered_at, created_at)
      VALUES (1, 'test-user-123', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    console.log('✅ Asistente de prueba creado correctamente');
    
    // Verificar los asistentes del evento
    const result = await db.execute(sql`
      SELECT id, user_id, status, registered_at 
      FROM event_attendees 
      WHERE event_id = 1
    `);
    
    console.log('📊 Asistentes del evento:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAttendeesColumns();
