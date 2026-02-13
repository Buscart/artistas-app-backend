import { db } from '../db.js';
import { userPreferences } from '../schema.js';
import { eq } from 'drizzle-orm';
export class UserPreferencesStorage {
    constructor(db) {
        this.db = db;
    }
    /**
     * Obtener preferencias de un usuario
     */
    async getUserPreferences(userId) {
        const [preferences] = await this.db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId));
        return preferences || null;
    }
    /**
     * Crear preferencias iniciales para un usuario
     */
    async createPreferences(userId) {
        const [preferences] = await this.db
            .insert(userPreferences)
            .values({
            userId,
            favoriteCategories: [],
            interests: [],
            priceRange: null,
            preferredLocations: [],
            notificationPreferences: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        if (!preferences) {
            throw new Error('Failed to create preferences');
        }
        return preferences;
    }
    /**
     * Obtener o crear preferencias
     */
    async getOrCreatePreferences(userId) {
        let preferences = await this.getUserPreferences(userId);
        if (!preferences) {
            preferences = await this.createPreferences(userId);
        }
        return preferences;
    }
    /**
     * Actualizar categorías favoritas
     */
    async updateFavoriteCategories(userId, categories) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            favoriteCategories: categories,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update favorite categories');
        }
        return updated;
    }
    /**
     * Actualizar intereses
     */
    async updateInterests(userId, interests) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            interests,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update interests');
        }
        return updated;
    }
    /**
     * Actualizar rango de precios
     */
    async updatePriceRange(userId, priceRange) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            priceRange,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update price range');
        }
        return updated;
    }
    /**
     * Actualizar ubicaciones preferidas
     */
    async updatePreferredLocations(userId, locations) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            preferredLocations: locations,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update preferred locations');
        }
        return updated;
    }
    /**
     * Actualizar preferencias de notificaciones
     */
    async updateNotificationPreferences(userId, notificationPreferences) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            notificationPreferences,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update notification preferences');
        }
        return updated;
    }
    /**
     * Actualizar todas las preferencias
     */
    async updatePreferences(userId, data) {
        const [updated] = await this.db
            .update(userPreferences)
            .set({
            ...data,
            updatedAt: new Date(),
        })
            .where(eq(userPreferences.userId, userId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update preferences');
        }
        return updated;
    }
    /**
     * Agregar categoría a favoritas
     */
    async addFavoriteCategory(userId, category) {
        const preferences = await this.getOrCreatePreferences(userId);
        const categories = preferences.favoriteCategories || [];
        if (!categories.includes(category)) {
            categories.push(category);
            return await this.updateFavoriteCategories(userId, categories);
        }
        return preferences;
    }
    /**
     * Remover categoría de favoritas
     */
    async removeFavoriteCategory(userId, category) {
        const preferences = await this.getOrCreatePreferences(userId);
        const categories = (preferences.favoriteCategories || []).filter(c => c !== category);
        return await this.updateFavoriteCategories(userId, categories);
    }
}
export const userPreferencesStorage = new UserPreferencesStorage(db);
