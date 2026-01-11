import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('📦 Ejecutando migraciones...');

    // Leer archivo de migración de favoritos
    const favoritesMigration = fs.readFileSync(
      path.join(__dirname, '../migrations/0019_create_favorites_table.sql'),
      'utf-8'
    );

    // Leer archivo de migración de disliked_items
    const dislikedMigration = fs.readFileSync(
      path.join(__dirname, '../migrations/0024_create_disliked_items.sql'),
      'utf-8'
    );

    console.log('🔄 Ejecutando migración de favorites...');
    await db.execute(sql.raw(favoritesMigration));
    console.log('✅ Migración de favorites completada');

    console.log('🔄 Ejecutando migración de disliked_items...');
    await db.execute(sql.raw(dislikedMigration));
    console.log('✅ Migración de disliked_items completada');

    console.log('🎉 Todas las migraciones completadas exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error ejecutando migraciones:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigrations();
