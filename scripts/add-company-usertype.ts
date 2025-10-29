import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

// Configurar rutas de directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definido en el archivo .env');
  process.exit(1);
}

async function addCompanyUserType() {
  console.log('🚀 Actualizando tipo de usuario para incluir "company"...');

  const sql = postgres(process.env.DATABASE_URL!);

  try {
    // Verificar si la columna ya acepta 'company'
    const checkResult = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'user_type'
    `;

    console.log('ℹ️  Estado actual de la columna user_type:', checkResult);

    // Primero, corregir cualquier valor inválido de user_type
    console.log('🔄 Corrigiendo valores inválidos de user_type...');
    const updateResult = await sql`
      UPDATE users
      SET user_type = 'general'
      WHERE user_type NOT IN ('general', 'artist', 'company')
    `;
    console.log(`✅ ${updateResult.count} registros actualizados`);

    // Si la columna es de tipo varchar sin restricción de enum,
    // podemos insertar 'company' directamente
    // Si hay una restricción CHECK, necesitamos eliminarla y recrearla

    // Opción 1: Eliminar restricción CHECK existente si existe
    await sql`
      DO $$
      BEGIN
        -- Buscar y eliminar cualquier restricción CHECK en user_type
        IF EXISTS (
          SELECT 1
          FROM information_schema.constraint_column_usage
          WHERE table_name = 'users'
          AND column_name = 'user_type'
          AND constraint_name LIKE '%user_type%'
        ) THEN
          EXECUTE (
            SELECT 'ALTER TABLE users DROP CONSTRAINT ' || constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_name = 'users'
            AND column_name = 'user_type'
            AND constraint_name LIKE '%user_type%'
            LIMIT 1
          );
        END IF;
      END $$;
    `;

    console.log('✅ Restricciones eliminadas (si existían)');

    // Opción 2: Agregar nueva restricción CHECK que permita 'general', 'artist', 'company'
    await sql`
      ALTER TABLE users
      ADD CONSTRAINT users_user_type_check
      CHECK (user_type IN ('general', 'artist', 'company'))
    `;

    console.log('✅ Nueva restricción CHECK agregada');

    // Verificar que funciona insertando un usuario de prueba (opcional)
    console.log('✅ Migración completada exitosamente');

  } catch (error: any) {
    console.error('❌ Error al actualizar tipo de usuario:', error);

    // Si el error es porque la restricción ya existe, está bien
    if (error.message?.includes('already exists') || error.message?.includes('ya existe')) {
      console.log('ℹ️  La restricción ya existe, no se necesita actualización');
    } else {
      console.error('❌ Error detallado:', error.message);
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

addCompanyUserType();
