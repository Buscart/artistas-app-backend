import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle> | undefined;
}

// Verificar que DATABASE_URL esté definida
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno');
  throw new Error("DATABASE_URL must be set in your environment variables.");
}

console.log('🔍 Configurando conexión a la base de datos...');
console.log('🔗 Host de la base de datos:', new URL(process.env.DATABASE_URL).hostname);

// ✅ ESTA es la forma correcta
const client = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 1 // opcional: máximo de conexiones
});

export const db = globalThis.db || drizzle(client);

// Hot reload dev
if (process.env.NODE_ENV !== 'production') {
  globalThis.db = db;
}

console.log('✅ Configuración de la base de datos completada');

export async function runMigrations() {
  console.log('ℹ️  Las migraciones están deshabilitadas temporalmente');
  console.log('💡 Usa el comando `npm run db:migrate` para aplicar migraciones manualmente');
}

console.log('ℹ️  Migraciones automáticas deshabilitadas temporalmente');
