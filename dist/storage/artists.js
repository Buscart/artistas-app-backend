import { db } from '../db.js';
import { artists, users, categories, disciplines, roles, specializations } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
export class ArtistStorage {
    constructor(db) {
        this.db = db;
    }
    async getArtist(id) {
        const userAlias = alias(users, 'user');
        const categoryAlias = alias(categories, 'category');
        const [result] = await this.db
            .select({
            artist: artists,
            user: userAlias,
            category: categoryAlias
        })
            .from(artists)
            .where(eq(artists.id, id))
            .leftJoin(userAlias, eq(artists.userId, userAlias.id))
            .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id));
        if (!result || !result.user)
            return undefined;
        return {
            artist: result.artist,
            user: result.user,
            category: result.category || undefined
        };
    }
    async getArtists(params) {
        const userAlias = alias(users, 'user');
        const categoryAlias = alias(categories, 'category');
        const disciplineAlias = alias(disciplines, 'discipline');
        const roleAlias = alias(roles, 'role');
        const specializationAlias = alias(specializations, 'specialization');
        // Construir la consulta base con los joins
        const query = this.db
            .select({
            artist: artists,
            user: userAlias,
            category: categoryAlias,
            discipline: disciplineAlias,
            role: roleAlias,
            specialization: specializationAlias
        })
            .from(artists)
            .leftJoin(userAlias, eq(artists.userId, userAlias.id))
            .leftJoin(categoryAlias, eq(artists.categoryId, categoryAlias.id))
            .leftJoin(disciplineAlias, eq(artists.disciplineId, disciplineAlias.id))
            .leftJoin(roleAlias, eq(artists.roleId, roleAlias.id))
            .leftJoin(specializationAlias, eq(artists.specializationId, specializationAlias.id));
        // Aplicar condiciones de filtrado
        const conditions = [];
        if (params?.category) {
            conditions.push(eq(categoryAlias.name, params.category));
        }
        if (params?.city) {
            conditions.push(eq(artists.baseCity, params.city)); // Usar baseCity
        }
        if (params?.priceMin !== undefined) {
            conditions.push(sql `${artists.hourlyRate} >= ${params.priceMin}`);
        }
        if (params?.priceMax !== undefined) {
            conditions.push(sql `${artists.hourlyRate} <= ${params.priceMax}`);
        }
        if (params?.availability !== undefined) {
            conditions.push(eq(artists.isAvailable, params.availability));
        }
        // Aplicar condiciones si existen
        const whereClause = conditions.length > 0
            ? and(...conditions)
            : undefined;
        // Ejecutar la consulta con las condiciones
        const results = whereClause
            ? await query.where(whereClause)
            : await query;
        // Filtrar resultados nulos y mapear a la estructura esperada
        return results
            .filter((result) => {
            return result.user !== null;
        })
            .map(result => ({
            artist: result.artist,
            user: result.user,
            category: result.category || undefined,
            discipline: result.discipline || undefined,
            role: result.role || undefined,
            specialization: result.specialization || undefined
        }));
    }
    async createArtist(data) {
        const [artist] = await this.db
            .insert(artists)
            .values({
            userId: data.userId,
            artistName: data.artistName,
            categoryId: data.categoryId,
            bio: data.bio,
            description: data.description ?? null,
            subcategories: data.subcategories ?? [],
            tags: data.tags ?? [],
            availability: data.availability ?? {},
            isAvailable: typeof data.isAvailable === 'boolean' ? data.isAvailable : true,
            stageName: data.stageName ?? null,
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
            socialMedia: data.socialMedia || {},
            isVerified: false,
            rating: '0',
            totalReviews: 0,
            fanCount: 0,
            metadata: {}
        })
            .returning();
        return artist;
    }
    async updateArtist(id, data) {
        const [artist] = await this.db
            .update(artists)
            .set({
            ...data,
            updatedAt: new Date()
        })
            .where(eq(artists.id, id))
            .returning();
        return artist;
    }
    async deleteArtist(id) {
        await this.db.delete(artists).where(eq(artists.id, id));
    }
}
export const artistStorage = new ArtistStorage(db);
