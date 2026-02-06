import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function fixTermsAcceptedColumn() {
  try {
    console.log('🔄 Agregando columna terms_accepted_at a la tabla users...');
    
    // Agregar columna terms_accepted_at
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP
    `);
    
    console.log('✅ Columna terms_accepted_at agregada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar columna:', error);
    process.exit(1);
  }
}

fixTermsAcceptedColumn();
