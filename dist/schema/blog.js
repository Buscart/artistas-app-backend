import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
export const blogPosts = pgTable('blog_posts', {
    id: serial('id').primaryKey(),
    authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // Información básica
    title: varchar('title').notNull(),
    slug: varchar('slug').notNull().unique(),
    subtitle: varchar('subtitle'),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    readingTime: integer('reading_time'), // Tiempo estimado de lectura en minutos
    // Categorización
    category: varchar('category'),
    subcategories: text('subcategories').array().default(sql `'{}'`),
    tags: text('tags').array().default(sql `'{}'`),
    // Multimedia
    featuredImage: varchar('featured_image'),
    gallery: jsonb('gallery').default(sql `'[]'`),
    videoUrl: varchar('video_url'),
    // Estadísticas
    viewCount: integer('view_count').default(sql `0`),
    likeCount: integer('like_count').default(sql `0`),
    commentCount: integer('comment_count').default(sql `0`),
    shareCount: integer('share_count').default(sql `0`),
    saveCount: integer('save_count').default(sql `0`), // Guardado en favoritos
    // Visibilidad y estado
    visibility: varchar('visibility', {
        enum: ['public', 'private', 'draft', 'archived']
    }).default('draft'),
    allowComments: boolean('allow_comments').default(true),
    isFeatured: boolean('is_featured').default(false),
    isVerified: boolean('is_verified').default(false),
    // SEO
    seoTitle: varchar('seo_title'),
    seoDescription: text('seo_description'),
    seoKeywords: text('seo_keywords'),
    // Fechas
    publishedAt: timestamp('published_at'),
    scheduledAt: timestamp('scheduled_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla para los comentarios del blog
export const blogComments = pgTable('blog_comments', {
    id: serial('id').primaryKey(),
    postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id').references(() => blogComments.id, { onDelete: 'cascade' }), // Para respuestas anidadas
    content: text('content').notNull(),
    isApproved: boolean('is_approved').default(true),
    likeCount: integer('like_count').default(sql `0`),
    replyCount: integer('reply_count').default(sql `0`),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla para los likes en publicaciones del blog
export const blogPostLikes = pgTable('blog_post_likes', {
    id: serial('id').primaryKey(),
    postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
}, (table) => ({
    // Asegura que un usuario solo pueda dar like una vez por publicación
    postUserIdx: uniqueIndex('post_user_idx').on(table.postId, table.userId),
}));
export const savedItems = pgTable('saved_items', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    postId: integer('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at').default(sql `CURRENT_TIMESTAMP`),
    notes: text('notes'),
    // Índice único para evitar duplicados
}, (table) => ({
    userPostIdx: uniqueIndex('user_post_idx').on(table.userId, table.postId),
}));
