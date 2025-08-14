import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from '../schema';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

// Extend Drizzle types with our schema
declare module 'drizzle-orm/pg-core' {
  interface PgSchema {
    users: typeof schema.users;
    artists: typeof schema.artists;
    categories: typeof schema.categories;
    events: typeof schema.events;
    blogPosts: typeof schema.blogPosts;
    favorites: typeof schema.favorites;
    messages: typeof schema.messages;
    recommendations: typeof schema.recommendations;
  }
}

// Simplified Database type that's compatible with PostgresJsDatabase
export type Database = import('drizzle-orm/postgres-js').PostgresJsDatabase<typeof schema>;

// Extend the db module to include our tables
declare module '../db' {
  export const db: Database;
  export default db;
}

// Helper types for database tables
export type UsersTable = typeof schema.users;
export type ArtistsTable = typeof schema.artists;
export type CategoriesTable = typeof schema.categories;
export type EventsTable = typeof schema.events;
export type BlogPostsTable = typeof schema.blogPosts;
export type FavoritesTable = typeof schema.favorites;
export type MessagesTable = typeof schema.messages;

export type RecommendationsTable = typeof schema.recommendations;

// Type utilities
export type WithRelations<T, R extends Record<string, any> = {}> = T & R;

// Infer types from schema
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Artist = typeof schema.artists.$inferSelect & {
  user: User;
  category?: typeof schema.categories.$inferSelect | null;
  languages?: string[];
};

export type NewArtist = Omit<typeof schema.artists.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> & {
  languages?: string[];
};

export type ArtistWithRelations = WithRelations<
  typeof schema.artists.$inferSelect,
  {
    user: typeof schema.users.$inferSelect;
    category?: typeof schema.categories.$inferSelect | null;
  }
>;

export type BlogPostWithAuthor = WithRelations<
  typeof schema.blogPosts.$inferSelect,
  {
    author: typeof schema.users.$inferSelect;
  }
>;
