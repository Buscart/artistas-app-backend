import { relations } from 'drizzle-orm';
import { pgTable, serial, varchar, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../schema.js';

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
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const postMedia = pgTable('post_media', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 1024 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'image', 'video', 'document'
  thumbnailUrl: varchar('thumbnail_url', { length: 1024 }),
  order: integer('order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
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

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostMedia = typeof postMedia.$inferSelect;
export type NewPostMedia = typeof postMedia.$inferInsert;
