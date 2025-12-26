import { db } from '../db.js';
import { favorites } from '../schema.js';
import { and, eq } from 'drizzle-orm';

export const favoritesService = {
  addFavorite: async (userId: string, entityType: string, entityId: number) => {
    const [favorite] = await db
      .insert(favorites)
      .values({ userId, entityType, entityId })
      .returning();
    return favorite;
  },

  removeFavorite: async (userId: string, entityType: string, entityId: number) => {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.entityType, entityType),
          eq(favorites.entityId, entityId)
        )
      );
  },

  getFavorites: async (userId: string) => {
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    return userFavorites;
  },
};
