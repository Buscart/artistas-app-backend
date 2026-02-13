import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { categories } from './hierarchy.js';
import { companies, venues } from './companies.js';
export const events = pgTable('events', {
    id: serial('id').primaryKey(),
    organizerId: varchar('organizer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    venueId: integer('venue_id').references(() => venues.id, { onDelete: 'set null' }),
    // Información básica
    title: varchar('title').notNull(),
    slug: varchar('slug').notNull().unique(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 300 }),
    // Categorización
    categoryId: integer('category_id').references(() => categories.id),
    subcategories: text('subcategories').array().default(sql `'{}'`),
    tags: text('tags').array().default(sql `'{}'`),
    eventType: varchar('event_type', {
        enum: ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other']
    }),
    // Fechas y horarios
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    timezone: varchar('timezone').default('America/Bogota'),
    isRecurring: boolean('is_recurring').default(false),
    recurrencePattern: jsonb('recurrence_pattern'), // Para eventos recurrentes
    // Ubicación
    locationType: varchar('location_type', { enum: ['physical', 'online', 'hybrid'] }).default('physical'),
    address: text('address'),
    city: varchar('city'),
    state: varchar('state'),
    country: varchar('country'),
    coordinates: jsonb('coordinates'), // { lat: number, lng: number }
    onlineEventUrl: varchar('online_event_url'),
    // Información del lugar
    venueName: varchar('venue_name'),
    venueDescription: text('venue_description'),
    venueCapacity: integer('venue_capacity'),
    isOutdoor: boolean('is_outdoor').default(false),
    // Información de entradas
    isFree: boolean('is_free').default(false),
    ticketPrice: numeric('ticket_price', { precision: 10, scale: 2 }),
    ticketUrl: varchar('ticket_url'),
    capacity: integer('capacity'),
    availableTickets: integer('available_tickets'),
    // Gestión de asistentes (Luma-style)
    requiresApproval: boolean('requires_approval').default(false),
    enableWaitlist: boolean('enable_waitlist').default(false),
    waitlistCapacity: integer('waitlist_capacity'),
    registrationDeadline: timestamp('registration_deadline'),
    // Multimedia
    featuredImage: varchar('featured_image'),
    gallery: jsonb('gallery').default(sql `'[]'`),
    videoUrl: varchar('video_url'),
    // Estado y visibilidad
    status: varchar('status', {
        enum: ['draft', 'published', 'cancelled', 'postponed', 'completed']
    }).default('draft'),
    isFeatured: boolean('is_featured').default(false),
    isVerified: boolean('is_verified').default(false),
    isOnline: boolean('is_online').default(false),
    // Estadísticas
    viewCount: integer('view_count').default(sql `0`),
    saveCount: integer('save_count').default(sql `0`),
    shareCount: integer('share_count').default(sql `0`),
    // Metadata
    seoTitle: varchar('seo_title'),
    seoDescription: text('seo_description'),
    seoKeywords: text('seo_keywords'),
    // Fechas de creación/actualización
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla para guardar eventos recurrentes generados
export const eventOccurrences = pgTable('event_occurrences', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    status: varchar('status', { enum: ['scheduled', 'cancelled', 'completed'] }).default('scheduled'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// =========================================================================
// Enhanced Events System - New Tables
// =========================================================================
// Tabla de tipos de boletos/entradas
export const ticketTypes = pgTable('ticket_types', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    // Información básica
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    // Precio
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('COP'),
    // Disponibilidad
    quantity: integer('quantity').notNull(),
    soldCount: integer('sold_count').default(0),
    // Período de venta
    saleStart: timestamp('sale_start'),
    saleEnd: timestamp('sale_end'),
    // Límites de compra
    minPerOrder: integer('min_per_order').default(1),
    maxPerOrder: integer('max_per_order').default(10),
    // Configuración
    isActive: boolean('is_active').default(true),
    requiresApproval: boolean('requires_approval').default(false),
    // Selección de asientos
    allowSeatSelection: boolean('allow_seat_selection').default(false),
    // Campos personalizados (JSON)
    customFields: jsonb('custom_fields').default(sql `'[]'`),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de asientos
export const seats = pgTable('seats', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    // Ubicación del asiento
    section: varchar('section', { length: 50 }).notNull(),
    row: varchar('row', { length: 10 }).notNull(),
    number: varchar('number', { length: 10 }).notNull(),
    // Estado del asiento
    status: varchar('status', {
        enum: ['available', 'reserved', 'sold', 'blocked']
    }).default('available'),
    // Tipo de boleto asignado
    ticketTypeId: integer('ticket_type_id').references(() => ticketTypes.id, { onDelete: 'set null' }),
    // Metadata (posición visual, características)
    metadata: jsonb('metadata').default(sql `'{}'`),
    // Información de reserva/venta
    reservedBy: varchar('reserved_by').references(() => users.id, { onDelete: 'set null' }),
    reservedAt: timestamp('reserved_at'),
    reservationExpiry: timestamp('reservation_expiry'),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de compras/órdenes
export const purchases = pgTable('purchases', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Totales
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    fees: numeric('fees', { precision: 10, scale: 2 }).default(sql `0`),
    taxes: numeric('taxes', { precision: 10, scale: 2 }).default(sql `0`),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('COP'),
    // Estado del pago
    paymentStatus: varchar('payment_status', {
        enum: ['pending', 'completed', 'failed', 'refunded']
    }).default('pending'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    paymentId: varchar('payment_id', { length: 255 }), // ID de Stripe, PayPal, etc.
    // Información de contacto
    email: varchar('email').notNull(),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    phone: varchar('phone'),
    // Timestamps
    purchasedAt: timestamp('purchased_at').default(sql `CURRENT_TIMESTAMP`),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de items de compra (líneas de la orden)
export const purchaseItems = pgTable('purchase_items', {
    id: serial('id').primaryKey(),
    purchaseId: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
    ticketTypeId: integer('ticket_type_id').notNull().references(() => ticketTypes.id, { onDelete: 'cascade' }),
    seatId: integer('seat_id').references(() => seats.id, { onDelete: 'set null' }),
    // Cantidad y precio
    quantity: integer('quantity').notNull().default(1),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Precio unitario al momento de la compra
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de asistentes (attendees) - une usuario, evento y boleto
// Soporta tanto eventos con tickets pagos como eventos gratuitos estilo Luma
export const eventAttendees = pgTable('event_attendees', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Información del boleto (opcional para eventos gratuitos)
    purchaseId: integer('purchase_id').references(() => purchases.id, { onDelete: 'cascade' }),
    ticketTypeId: integer('ticket_type_id').references(() => ticketTypes.id, { onDelete: 'cascade' }),
    seatId: integer('seat_id').references(() => seats.id, { onDelete: 'set null' }),
    // Estado del asistente (sistema Luma + tradicional)
    status: varchar('status', {
        enum: ['pending', 'approved', 'rejected', 'waitlisted', 'registered', 'checked_in', 'no_show', 'cancelled']
    }).default('pending'),
    // Respuestas a campos personalizados
    customFieldResponses: jsonb('custom_field_responses').default(sql `'{}'`),
    // Gestión de aprobación (Luma-style)
    statusUpdatedAt: timestamp('status_updated_at'),
    notes: text('notes'), // Notas del organizador sobre el asistente
    // Check-in
    checkedInAt: timestamp('checked_in_at'),
    checkedInBy: varchar('checked_in_by').references(() => users.id, { onDelete: 'set null' }),
    // Timestamps
    registeredAt: timestamp('registered_at').default(sql `CURRENT_TIMESTAMP`),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
    // Certificado de asistencia
    certificateUrl: varchar('certificate_url'),
    certificateGeneratedAt: timestamp('certificate_generated_at'),
});
// =========================================================================
// Reseñas de eventos
// =========================================================================
export const eventReviews = pgTable('event_reviews', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Calificación y contenido
    rating: integer('rating').notNull(), // 1-5 estrellas
    title: varchar('title', { length: 100 }),
    comment: text('comment'),
    // Respuesta del organizador
    organizerResponse: text('organizer_response'),
    organizerResponseAt: timestamp('organizer_response_at'),
    // Estado
    isVerified: boolean('is_verified').default(false), // Verificado que asistió
    isHidden: boolean('is_hidden').default(false),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// =========================================================================
// Agenda de eventos (itinerario)
// =========================================================================
export const eventAgenda = pgTable('event_agenda', {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    // Información del ítem de agenda
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    // Ubicación específica (si es diferente al evento principal)
    location: varchar('location', { length: 200 }),
    // Ponente/facilitador
    speakerName: varchar('speaker_name', { length: 100 }),
    speakerTitle: varchar('speaker_title', { length: 100 }),
    speakerImage: varchar('speaker_image'),
    // Orden de visualización
    sortOrder: integer('sort_order').default(0),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
