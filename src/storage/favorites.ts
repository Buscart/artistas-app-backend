import { db } from '../db.js';
import { favorites, users } from '../schema.js';
import { eq, and, isNotNull, SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';

type Favorite = typeof favorites.$inferSelect;
type User = typeof users.$inferSelect;
type FavoriteWithUser = Favorite & {
  user: User;
};

export class FavoriteStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  async getFavorites(filters: { userId: string }): Promise<FavoriteWithUser[]> {
    const userAlias = alias(users, 'user');
    
    const query = this.db
      .select({
        ...Object.keys(favorites).reduce((acc, key) => ({
          ...acc,
          [key]: favorites[key as keyof typeof favorites]
        }), {}),
        user: userAlias
      })
      .from(favorites)
      .innerJoin(userAlias, eq(favorites.userId, userAlias.id))
      .where(eq(favorites.userId, filters.userId));

    const results = await query;
    return results as unknown as FavoriteWithUser[];
  }

  async getUserFavorites(userId: string, targetType?: 'artist' | 'event' | 'venue' | 'gallery'): Promise<FavoriteWithUser[]> {
    const userAlias = alias(users, 'user');
    
    let query = this.db
      .select({
        ...Object.keys(favorites).reduce((acc, key) => ({
          ...acc,
          [key]: favorites[key as keyof typeof favorites]
        }), {}),
        user: userAlias
      })
      .from(favorites)
      .innerJoin(userAlias, eq(favorites.userId, userAlias.id))
      .where(eq(favorites.userId, userId));

    if (targetType) {
      const column = `${targetType}Id` as keyof typeof favorites;
      const columnRef = favorites[column] as PgColumn;
      (query as any).where(isNotNull(columnRef));
    }

    const results = await query;
    return results as unknown as FavoriteWithUser[];
  }

  async addFavorite(favorite: Omit<typeof favorites.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Favorite> {
    const [result] = await this.db
      .insert(favorites)
      .values({
        ...favorite,
        createdAt: new Date()
      } as any) // Using 'as any' to bypass the type checking for the insert
      .returning();
      
    if (!result) {
      throw new Error('Failed to add favorite');
    }
    
    return result;
  }

  async removeFavorite(
    userId: string, 
    targetId: number, 
    targetType: 'artist' | 'event' | 'venue' | 'gallery'
  ): Promise<void> {
    type FavoriteType = typeof targetType;
    type ColumnName = `${FavoriteType}Id`;
    
    const targetColumn = `${targetType}Id` as ColumnName;
    
    await this.db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites[targetColumn] as PgColumn, targetId)
        )
      );
  }

  async isFavorite(data: {
    userId: string;
    type: 'artist' | 'event' | 'venue' | 'gallery';
    artistId?: number;
    eventId?: number;
    venueId?: number;
    galleryId?: number;
  }): Promise<boolean> {
    const conditions: SQL[] = [
      eq(favorites.userId, data.userId),
      eq(favorites.type, data.type)
    ];

    if (data.artistId) conditions.push(eq(favorites.artistId as PgColumn, data.artistId));
    if (data.eventId) conditions.push(eq(favorites.eventId as PgColumn, data.eventId));
    if (data.venueId) conditions.push(eq(favorites.venueId as PgColumn, data.venueId));
    if (data.galleryId) conditions.push(eq(favorites.galleryId as PgColumn, data.galleryId));

    const [favorite] = await this.db
      .select()
      .from(favorites)
      .where(and(...conditions));

    return !!favorite;
  }

  async toggleFavorite(data: {
    userId: string;
    type: 'artist' | 'event' | 'venue' | 'gallery';
    artistId?: number;
    eventId?: number;
    venueId?: number;
    galleryId?: number;
  }) {
    const isFavorited = await this.isFavorite(data);
    
    if (isFavorited) {
      const conditions = [
        eq(favorites.userId, data.userId),
        eq(favorites.type, data.type)
      ];

      if (data.artistId) conditions.push(eq(favorites.artistId, data.artistId));
      if (data.eventId) conditions.push(eq(favorites.eventId, data.eventId));
      if (data.venueId) conditions.push(eq(favorites.venueId, data.venueId));
      if (data.galleryId) conditions.push(eq(favorites.galleryId, data.galleryId));

      const [favorite] = await this.db
        .select()
        .from(favorites)
        .where(and(...conditions));

      if (favorite) {
        // Find the target type and ID
      const targetType = (['artist', 'event', 'venue', 'gallery'] as const).find(type => 
        favorite[`${type}Id` as keyof typeof favorite] !== null
      );
      
      if (targetType) {
        const targetId = favorite[`${targetType}Id` as keyof typeof favorite];
        if (typeof targetId === 'number') {
          await this.removeFavorite(data.userId, targetId, targetType);
          return { favorited: false };
        }
      }
      }
    }

    // If not favorited, add it
    const favorite = await this.addFavorite({
      userId: data.userId,
      type: data.type,
      artistId: data.artistId || null,
      eventId: data.eventId || null,
      venueId: data.venueId || null,
      galleryId: data.galleryId || null
    });
    
    return { favorited: true, favorite };
  }
}

export const favoriteStorage = new FavoriteStorage(db);
