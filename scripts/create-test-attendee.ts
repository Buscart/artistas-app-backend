import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function createTestAttendee() {
  try {
    console.log('🔄 Creando asistente de prueba...');
    
    // Crear un asistente de prueba para el evento 1
    await db.execute(sql`
      INSERT INTO event_attendees (event_id, user_id, status, registered_at, created_at)
      VALUES (1, 'test-user-123', 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING
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
    console.error('❌ Error al crear asistente:', error);
    process.exit(1);
  }
}

createTestAttendee();
