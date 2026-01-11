import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function checkAndCreateTables() {
  try {
    console.log('🔍 Verificando existencia de tablas...');

    // Verificar si la tabla favorites existe
    const favoritesExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'favorites'
      );
    `);

    console.log('favorites existe?', favoritesExists);

    const exists = (favoritesExists as any)[0]?.exists;
    console.log('Valor de exists:', exists);

    if (!exists) {
      console.log('❌ Tabla favorites NO existe. Creándola...');

      await db.execute(sql`
        CREATE TABLE "favorites" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" varchar NOT NULL,
          "entity_id" integer NOT NULL,
          "entity_type" varchar NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "favorites_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE cascade
        );
      `);

      await db.execute(sql`
        CREATE INDEX "favorites_user_id_index" ON "favorites" ("user_id");
      `);

      await db.execute(sql`
        CREATE INDEX "favorites_entity_index" ON "favorites" ("entity_id", "entity_type");
      `);

      console.log('✅ Tabla favorites creada exitosamente');
    } else {
      console.log('✅ Tabla favorites ya existe');
    }

    // Verificar si la tabla disliked_items existe
    const dislikedExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'disliked_items'
      );
    `);

    console.log('disliked_items existe?', dislikedExists);

    const dislikedExistsValue = (dislikedExists as any)[0]?.exists;

    if (!dislikedExistsValue) {
      console.log('❌ Tabla disliked_items NO existe. Creándola...');

      await db.execute(sql`
        CREATE TABLE "disliked_items" (
          "id" serial PRIMARY KEY,
          "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "entity_id" INTEGER NOT NULL,
          "entity_type" VARCHAR NOT NULL,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE("user_id", "entity_id", "entity_type")
        );
      `);

      await db.execute(sql`
        CREATE INDEX "idx_disliked_items_user_id" ON "disliked_items"("user_id");
      `);

      await db.execute(sql`
        CREATE INDEX "idx_disliked_items_entity" ON "disliked_items"("entity_type", "entity_id");
      `);

      await db.execute(sql`
        CREATE INDEX "idx_disliked_items_created_at" ON "disliked_items"("created_at");
      `);

      console.log('✅ Tabla disliked_items creada exitosamente');
    } else {
      console.log('✅ Tabla disliked_items ya existe');
    }

    console.log('🎉 Verificación completada');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkAndCreateTables();
