import { pgTable, serial, varchar, text, timestamp, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

// Tabla de colecciones de posts (estilo Pinterest)
export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Información básica
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),

  // Configuración de privacidad
  isPublic: boolean('is_public').default(false),

  // Cover image (portada de la colección)
  coverImageUrl: varchar('cover_image_url'),

  // Estadísticas
  itemCount: integer('item_count').default(0),
  viewCount: integer('view_count').default(0),

  // Timestamps
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de items guardados en colecciones
export const collectionItems = pgTable('collection_items', {
  id: serial('id').primaryKey(),
  collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull(),
  postType: varchar('post_type', { length: 20 }).notNull().default('post'),

  // Notas personales del usuario sobre este item
  notes: text('notes'),

  // Timestamps
  addedAt: timestamp('added_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  collectionPostIdx: uniqueIndex('collection_post_idx').on(table.collectionId, table.postId, table.postType),
}));

// Tabla de inspiraciones/referencias para artistas
export const inspirations = pgTable('inspirations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull(),
  postType: varchar('post_type', { length: 20 }).notNull().default('post'),

  // Por qué les inspiró
  inspirationNote: text('inspiration_note'),

  // Tags personalizados para organizar inspiraciones
  tags: text('tags').array().default(sql`'{}'`),

  // Tipo de inspiración
  inspirationType: varchar('inspiration_type', {
    enum: ['technique', 'composition', 'color', 'style', 'concept', 'other']
  }),

  // Timestamps
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userPostIdx: uniqueIndex('inspiration_user_post_idx').on(table.userId, table.postId, table.postType),
}));
