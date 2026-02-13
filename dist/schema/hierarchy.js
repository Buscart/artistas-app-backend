import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de Disciplinas (nivel 2 de jerarquía)
export const disciplines = pgTable('disciplines', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de Roles (nivel 3 de jerarquía)
export const roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    disciplineId: integer('discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    description: text('description'),
    icon: varchar('icon', { length: 100 }),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de Especializaciones (nivel 4 de jerarquía)
export const specializations = pgTable('specializations', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    disciplineId: integer('discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    description: text('description'),
    isCustom: boolean('is_custom').default(false),
    isApproved: boolean('is_approved').default(false),
    proposedBy: varchar('proposed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de TADs - Talentos Adicionales sugeridos
export const tads = pgTable('tads', {
    id: serial('id').primaryKey(),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    suggestedDisciplineId: integer('suggested_discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(0),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de Stats sugeridos por Rol
export const roleStats = pgTable('role_stats', {
    id: serial('id').primaryKey(),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    statKey: varchar('stat_key', { length: 100 }).notNull(),
    statLabel: varchar('stat_label', { length: 255 }).notNull(),
    statType: varchar('stat_type', { length: 50 }).notNull(), // 'text', 'number', 'select', 'multiselect', 'range'
    statOptions: jsonb('stat_options'),
    isRequired: boolean('is_required').default(false),
    placeholder: varchar('placeholder', { length: 255 }),
    helpText: text('help_text'),
    validationRules: jsonb('validation_rules'),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de propuestas de TADs personalizados
export const customTadProposals = pgTable('custom_tad_proposals', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    proposedDisciplineName: varchar('proposed_discipline_name', { length: 255 }).notNull(),
    justification: text('justification'),
    status: varchar('status', { length: 50 }).default('pending'),
    reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de propuestas de Especializaciones personalizadas
export const customSpecializationProposals = pgTable('custom_specialization_proposals', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    proposedName: varchar('proposed_name', { length: 255 }).notNull(),
    proposedCode: varchar('proposed_code', { length: 100 }).notNull(),
    description: text('description'),
    justification: text('justification'),
    status: varchar('status', { length: 50 }).default('pending'),
    reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
