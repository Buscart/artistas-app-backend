import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import type { Database } from './types/db.js';

// Cargar variables de entorno
dotenv.config();

// Verificar que DATABASE_URL esté definida
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno');
  throw new Error("DATABASE_URL must be set in your environment variables.");
}

console.log('🔍 Configurando conexión a la base de datos...');
console.log('🔗 Host de la base de datos:', new URL(process.env.DATABASE_URL).hostname);

// Crear el cliente de PostgreSQL
const client = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Aumentar el número de conexiones
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

// Crear la instancia de Drizzle ORM
declare global {
  // eslint-disable-next-line no-var
  var db: Database | undefined;
}

let db: Database;

if (process.env.NODE_ENV === 'production') {
  db = drizzle(client, { schema });
} else {
  if (!global.db) {
    global.db = drizzle(client, { schema });
  }
  db = global.db;
}

export { db };

// Hot reload dev
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.on('vite:beforeFullReload', () => {
      client.end();
    });
  }
}

// Migraciones
export async function runMigrations() {
  // Implementación de migraciones
  console.log('ℹ️  Migraciones automáticas deshabilitadas temporalmente');
}

console.log('ℹ️  Migraciones automáticas deshabilitadas temporalmente');
