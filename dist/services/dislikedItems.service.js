import { db } from '../db.js';
import { dislikedItems } from '../schema.js';
import { and, eq } from 'drizzle-orm';
export const dislikedItemsService = {
    /**
     * Añadir un item a la lista de "no me interesa"
     */
    async addDislikedItem(userId, entityType, entityId) {
        const [dislikedItem] = await db
            .insert(dislikedItems)
            .values({ userId, entityType, entityId })
            .onConflictDoNothing() // Evitar duplicados
            .returning();
        return dislikedItem;
    },
    /**
     * Eliminar un item de la lista de "no me interesa"
     */
    async removeDislikedItem(userId, entityType, entityId) {
        await db
            .delete(dislikedItems)
            .where(and(eq(dislikedItems.userId, userId), eq(dislikedItems.entityType, entityType), eq(dislikedItems.entityId, entityId)));
    },
    /**
     * Obtener todos los items que no le gustan al usuario
     */
    async getDislikedItems(userId) {
        const userDislikedItems = await db
            .select()
            .from(dislikedItems)
            .where(eq(dislikedItems.userId, userId));
        return userDislikedItems;
    },
    /**
     * Verificar si un item está en la lista de "no me interesa"
     */
    async isDisliked(userId, entityType, entityId) {
        const [result] = await db
            .select()
            .from(dislikedItems)
            .where(and(eq(dislikedItems.userId, userId), eq(dislikedItems.entityType, entityType), eq(dislikedItems.entityId, entityId)))
            .limit(1);
        return !!result;
    },
};
