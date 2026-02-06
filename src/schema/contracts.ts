import { pgTable, serial, varchar, text, timestamp, integer, numeric, jsonb, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

// Tabla de contrataciones del usuario (historial de compras/contrataciones)
export const userContracts = pgTable('user_contracts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').notNull().references(() => users.id),
  quotationId: integer('quotation_id'), // Referencia a la cotización original
  serviceId: integer('service_id'),
  serviceType: varchar('service_type').notNull(), // 'event', 'service', 'custom'
  serviceName: varchar('service_name').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }), // Comisión de la plataforma
  artistAmount: numeric('artist_amount', { precision: 10, scale: 2 }), // Lo que recibe el artista
  status: varchar('status', { enum: ['pending', 'awaiting_payment', 'paid', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'] }).default('pending'),
  paymentStatus: varchar('payment_status', { enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] }).default('pending'),
  contractDate: timestamp('contract_date').default(sql`CURRENT_TIMESTAMP`),
  serviceDate: timestamp('service_date'),
  completionDate: timestamp('completion_date'),
  // Firmas digitales
  clientSigned: boolean('client_signed').default(false),
  clientSignedAt: timestamp('client_signed_at'),
  artistSigned: boolean('artist_signed').default(false),
  artistSignedAt: timestamp('artist_signed_at'),
  contractTerms: text('contract_terms'), // Términos del contrato
  // Reseña
  rating: integer('rating'), // 1-5
  review: text('review'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de pagos
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  contractId: integer('contract_id').notNull(),
  userId: varchar('user_id').notNull().references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('COP'),
  paymentMethod: varchar('payment_method', { enum: ['credit_card', 'debit_card', 'pse', 'nequi', 'daviplata', 'efecty', 'bank_transfer'] }),
  paymentProvider: varchar('payment_provider'), // 'stripe', 'mercadopago', 'wompi', etc.
  providerTransactionId: varchar('provider_transaction_id'), // ID de transacción del proveedor
  status: varchar('status', { enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] }).default('pending'),
  failureReason: text('failure_reason'),
  paidAt: timestamp('paid_at'),
  refundedAt: timestamp('refunded_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de solicitudes de cotización
export const userQuotations = pgTable('user_quotations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').notNull().references(() => users.id),
  serviceType: varchar('service_type').notNull(),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  budgetMin: numeric('budget_min', { precision: 10, scale: 2 }),
  budgetMax: numeric('budget_max', { precision: 10, scale: 2 }),
  preferredDate: timestamp('preferred_date'),
  location: varchar('location'),
  status: varchar('status', { enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired'] }).default('pending'),
  quotedAmount: numeric('quoted_amount', { precision: 10, scale: 2 }),
  artistResponse: text('artist_response'),
  responseDate: timestamp('response_date'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
