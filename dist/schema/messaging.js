import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { posts } from '../models/post.model.js';
export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    senderId: varchar('sender_id').notNull().references(() => users.id),
    receiverId: varchar('receiver_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    sharedPostId: integer('shared_post_id').references(() => posts.id, { onDelete: 'set null' }),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
});
