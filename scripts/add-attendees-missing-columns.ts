import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function addAttendeesMissingColumns() {
  try {
    console.log('🔄 Agregando columnas faltantes a event_attendees...');
    
    // Agregar columna status_updated_at
    await db.execute(sql`
      ALTER TABLE event_attendees 
      ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP
    `);
    
    // Agregar columna notes
    await db.execute(sql`
      ALTER TABLE event_attendees 
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    
    console.log('✅ Columnas agregadas correctamente');
    
    // Verificar las columnas
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'event_attendees' 
      AND column_name IN ('status_updated_at', 'notes')
      ORDER BY column_name
    `);
    console.log('📊 Columnas verificadas:', columns);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
    process.exit(1);
  }
}

addAttendeesMissingColumns();
