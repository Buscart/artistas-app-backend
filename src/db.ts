import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import type { Database } from './types/db.js';

// Cargar variables de entorno
dotenv.config();

// Declaración global al nivel superior
declare global {
  // eslint-disable-next-line no-var
  var db: Database | undefined;
}

// Verificar y configurar base de datos
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
let dbReady = false;
let db: Database; // siempre definido (real o proxy)
let client: ReturnType<typeof postgres> | undefined;

if (!hasDatabaseUrl) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  DATABASE_URL no definida. Ejecutando sin base de datos en desarrollo.');
  } else {
    console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno');
    // Crear un proxy que lance errores en tiempo de ejecución si se usa sin DB
    db = new Proxy({}, {
      get() {
        throw new Error('Database not configured. Define DATABASE_URL para usar la base de datos.');
      },
      apply() {
        throw new Error('Database not configured.');
      },
    }) as unknown as Database;
    // dbReady permanece en false
  }
} else {
  console.log('🔍 Configurando conexión a la base de datos...');
  try {
    console.log('🔗 Host de la base de datos:', new URL(process.env.DATABASE_URL!).hostname);
  } catch {}

  // Crear el cliente de PostgreSQL
  client = postgres(process.env.DATABASE_URL!, {
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  if (process.env.NODE_ENV === 'production') {
    db = drizzle(client, { schema }) as Database;
  } else {
    const g = globalThis as any;
    if (!g.db) {
      g.db = drizzle(client, { schema }) as Database;
    }
    db = g.db as Database;
  }
  dbReady = true;
}

export { db };
export { dbReady };

// Hot reload dev
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  if (import.meta.hot) {
    // @ts-ignore
    import.meta.hot.on('vite:beforeFullReload', () => {
      client?.end();
    });
  }
}

// Migraciones
export async function runMigrations() {
  // Implementación de migraciones
  console.log('ℹ️  Migraciones automáticas deshabilitadas temporalmente');
}

console.log('ℹ️  Migraciones automáticas deshabilitadas temporalmente');
