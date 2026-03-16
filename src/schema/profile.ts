import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const gallery = pgTable('gallery', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title'),
  description: text('description'),
  imageUrl: varchar('image_url').notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  orderPosition: integer('order_position').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de vistas de perfil
export const profileViews = pgTable('profile_views', {
  id: serial('id').primaryKey(),
  profileId: varchar('profile_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewerId: varchar('viewer_id').references(() => users.id, { onDelete: 'set null' }), // null = anónimo
  viewerIp: varchar('viewer_ip'), // Para contar vistas anónimas
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de logros/achievements
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull().unique(), // 'first_profile', 'first_follower', etc.
  name: varchar('name').notNull(),
  description: text('description'),
  icon: varchar('icon'), // Emoji o URL de icono
  category: varchar('category', { enum: ['profile', 'social', 'work', 'milestone'] }),
  points: integer('points').default(0),
  requirement: jsonb('requirement'), // Criterio para desbloquear
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de logros desbloqueados por usuarios
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').default(sql`CURRENT_TIMESTAMP`),
  notified: boolean('notified').default(false), // Si ya se notificó al usuario
});

export const featuredItems = pgTable('featured_items', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  type: varchar('type', { enum: ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'] }).notNull(),
  thumbnailUrl: text('thumbnail_url'),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla para las 4 fotos destacadas del perfil (obligatorias para artistas)
export const highlightPhotos = pgTable('highlight_photos', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url').notNull(),
  position: integer('position').notNull(), // 1, 2, 3, 4
  caption: text('caption'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Asegura que cada usuario solo tenga una foto por posición
  userPositionIdx: uniqueIndex('user_position_idx').on(table.userId, table.position),
}));

// Tabla de preferencias de usuario para recomendaciones
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  favoriteCategories: text('favorite_categories').array().default(sql`'{}'`),
  interests: text('interests').array().default(sql`'{}'`),
  priceRange: jsonb('price_range'), // { min: number, max: number }
  preferredLocations: text('preferred_locations').array().default(sql`'{}'`),
  notificationPreferences: jsonb('notification_preferences').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de analytics de perfil (para artistas y empresas)
export const profileAnalytics = pgTable('profile_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  profileViews: integer('profile_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  clicksOnContact: integer('clicks_on_contact').default(0),
  clicksOnSocial: integer('clicks_on_social').default(0),
  favoriteAdds: integer('favorite_adds').default(0),
  shareCount: integer('share_count').default(0),
  averageTimeOnProfile: integer('average_time_on_profile').default(0), // en segundos
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de documentos de usuario
export const userDocuments = pgTable('user_documents', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'id', 'tax', 'contract', 'certification'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'), // Tamaño en bytes
  mimeType: varchar('mime_type', { length: 100 }),
  status: varchar('status', {
    length: 20,
    enum: ['pending', 'approved', 'rejected', 'expired']
  }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  expiryDate: timestamp('expiry_date'),
  reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  uploadedAt: timestamp('uploaded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
