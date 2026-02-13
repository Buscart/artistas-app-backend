import { relations } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../schema/users.js';
export const postTypeEnum = pgEnum('post_type', ['post', 'nota', 'blog']);
export const posts = pgTable('posts', {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: postTypeEnum('type').notNull().default('post'),
    isPinned: boolean('is_pinned').default(false),
    isPublic: boolean('is_public').default(true),
    likeCount: integer('like_count').default(0),
    commentCount: integer('comment_count').default(0),
    shareCount: integer('share_count').default(0),
    viewCount: integer('view_count').default(0),
    metadata: jsonb('metadata'), // Para guardar datos adicionales como sharedPostId
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
export const postMedia = pgTable('post_media', {
    id: serial('id').primaryKey(),
    postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    url: varchar('url', { length: 1024 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'image', 'video', 'document'
    thumbnailUrl: varchar('thumbnail_url', { length: 1024 }),
    order: integer('order').default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
export const postRelations = relations(posts, ({ many }) => ({
    media: many(postMedia),
}));
export const postMediaRelations = relations(postMedia, ({ one }) => ({
    post: one(posts, {
        fields: [postMedia.postId],
        references: [posts.id],
    }),
}));
// Tabla de comentarios
export const comments = pgTable('comments', {
    id: serial('id').primaryKey(),
    postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id'),
    content: text('content').notNull(),
    // Funcionalidades avanzadas
    images: text('images').array().default(sql `'{}'::text[]`),
    mentions: text('mentions').array().default(sql `'{}'::text[]`),
    taggedArtists: integer('tagged_artists').array().default(sql `'{}'::integer[]`),
    taggedEvents: integer('tagged_events').array().default(sql `'{}'::integer[]`),
    poll: jsonb('poll'), // { question: string, options: string[] }
    // Interacciones
    likeCount: integer('like_count').default(0),
    replyCount: integer('reply_count').default(0),
    // Estado
    isApproved: boolean('is_approved').default(true),
    isEdited: boolean('is_edited').default(false),
    // Timestamps
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
    editedAt: timestamp('edited_at'),
});
// Tabla de likes en comentarios
export const commentLikes = pgTable('comment_likes', {
    id: serial('id').primaryKey(),
    commentId: integer('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de votos en encuestas de comentarios
export const commentPollVotes = pgTable('comment_poll_votes', {
    id: serial('id').primaryKey(),
    commentId: integer('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    optionIndex: integer('option_index').notNull(),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
// Relaciones
export const commentRelations = relations(comments, ({ one, many }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    author: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
    }),
    replies: many(comments),
    likes: many(commentLikes),
    pollVotes: many(commentPollVotes),
}));
