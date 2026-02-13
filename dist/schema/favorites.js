import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
export const favorites = pgTable('favorites', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    entityId: integer('entity_id').notNull(),
    entityType: varchar('entity_type').notNull(),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`).notNull(),
});
// Tabla de items que no le gustan al usuario (para mejorar recomendaciones)
export const dislikedItems = pgTable('disliked_items', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    entityId: integer('entity_id').notNull(),
    entityType: varchar('entity_type').notNull(),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`).notNull(),
});
// Tabla de colaboraciones entre artistas
export const collaborations = pgTable('collaborations', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Información de la colaboración
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    collaborationType: varchar('collaboration_type', {
        enum: ['musician', 'producer', 'composer', 'choreographer', 'other']
    }).notNull(),
    // Detalles
    genre: varchar('genre'),
    skills: text('skills'), // JSON string de habilidades requeridas
    budget: varchar('budget'),
    deadline: timestamp('deadline'),
    // Estado
    status: varchar('status', {
        enum: ['active', 'in_progress', 'completed', 'cancelled']
    }).default('active'),
    // Metadata
    responseCount: integer('response_count').default(0),
    viewCount: integer('view_count').default(0),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
