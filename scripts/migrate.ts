import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Configurar rutas de directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definido en el archivo .env');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Iniciando migraciones...');
  
  try {
    // Crear conexión a la base de datos
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(sql);

    // Ejecutar migraciones
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migraciones aplicadas correctamente');
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error);
    process.exit(1);
  } finally {
    // Cerrar la conexión
    process.exit(0);
  }
}

runMigrations();
