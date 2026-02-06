import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function addRequiresApprovalColumn() {
  try {
    console.log('🔄 Agregando columna requires_approval a la tabla events...');
    
    // Agregar columna requires_approval
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE
    `);
    
    console.log('✅ Columna requires_approval agregada correctamente');
    
    // Agregar otras columnas relacionadas
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS enable_waitlist BOOLEAN DEFAULT FALSE
    `);
    
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS waitlist_capacity INTEGER
    `);
    
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP
    `);
    
    console.log('✅ Todas las columnas agregadas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
    process.exit(1);
  }
}

addRequiresApprovalColumn();
