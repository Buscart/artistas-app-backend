import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function enableWaitlist() {
  try {
    console.log('🔄 Activando waitlist para el evento ID 1...');
    
    // Actualizar evento para tener waitlist habilitado
    await db.execute(sql`
      UPDATE events 
      SET enable_waitlist = TRUE, 
          waitlist_capacity = 10,
          requires_approval = TRUE
      WHERE id = 1
    `);
    
    console.log('✅ Waitlist activado correctamente');
    
    // Verificar el evento
    const result = await db.execute(sql`
      SELECT enable_waitlist, waitlist_capacity, requires_approval 
      FROM events 
      WHERE id = 1
    `);
    
    console.log('📊 Estado del evento:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al activar waitlist:', error);
    process.exit(1);
  }
}

enableWaitlist();
