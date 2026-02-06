import { db } from '../db.js';
import { favorites } from '../schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';

export const favoritesService = {
  addFavorite: async (userId: string, entityType: string, entityId: number) => {
    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.entityType, entityType),
          eq(favorites.entityId, entityId)
        )
      )
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

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
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    // Eliminar duplicados: mantener solo el más reciente por entityType + entityId
    const seen = new Map<string, typeof userFavorites[0]>();
    for (const fav of userFavorites) {
      const key = `${fav.entityType}_${fav.entityId}`;
      if (!seen.has(key)) {
        seen.set(key, fav);
      }
    }

    return Array.from(seen.values());
  },

  // Limpiar duplicados de la base de datos
  cleanupDuplicates: async (userId: string) => {
    // Obtener todos los favoritos del usuario
    const allFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    // Agrupar por entityType + entityId y encontrar duplicados
    const groups = new Map<string, number[]>();
    for (const fav of allFavorites) {
      const key = `${fav.entityType}_${fav.entityId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(fav.id);
    }

    // Eliminar duplicados (mantener el primero, que es el más reciente)
    let deletedCount = 0;
    for (const [, ids] of groups) {
      if (ids.length > 1) {
        // Eliminar todos excepto el primero (más reciente)
        const idsToDelete = ids.slice(1);
        for (const id of idsToDelete) {
          await db.delete(favorites).where(eq(favorites.id, id));
          deletedCount++;
        }
      }
    }

    return { deletedCount };
  },
};
