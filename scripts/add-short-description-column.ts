import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';
import { logger } from '../src/utils/logger.js';

async function addShortDescriptionColumn() {
  try {
    logger.info('Verificando si la columna short_description existe...', undefined, 'MIGRATION');

    // Verificar si la columna ya existe
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name = 'short_description';
    `) as any;

    const rows = result?.rows || result || [];

    if (Array.isArray(rows) && rows.length > 0) {
      logger.info('La columna short_description ya existe en la tabla companies', undefined, 'MIGRATION');
      process.exit(0);
      return;
    }

    logger.info('Agregando columna short_description a la tabla companies...', undefined, 'MIGRATION');

    // Agregar la columna
    await db.execute(sql`
      ALTER TABLE companies
      ADD COLUMN short_description VARCHAR(300);
    `);

    logger.info('✅ Columna short_description agregada exitosamente', undefined, 'MIGRATION');

  } catch (error) {
    if ((error as any)?.message?.includes('already exists')) {
      logger.info('La columna short_description ya existe', undefined, 'MIGRATION');
    } else {
      logger.error('Error al agregar columna short_description', error as Error, 'MIGRATION');
    }
  } finally {
    process.exit(0);
  }
}

addShortDescriptionColumn();
