import { venues, users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
export class VenueStorage {
    constructor(db) {
        this.db = db;
    }
    async getVenue(id) {
        const companyAlias = alias(users, 'company');
        const results = await this.db
            .select()
            .from(venues)
            .leftJoin(companyAlias, eq(venues.companyId, companyAlias.id))
            .where(eq(venues.id, id));
        const result = results[0];
        if (!result)
            return undefined;
        // Create a proper company object with all required fields
        const company = result.company || {
            id: '',
            email: '',
            password: null,
            firstName: '',
            lastName: null,
            displayName: null,
            profileImageUrl: null,
            coverImageUrl: null,
            userType: 'company',
            bio: null,
            city: null,
            address: null,
            phone: null,
            website: null,
            socialMedia: null,
            isVerified: false,
            isFeatured: false,
            isAvailable: true,
            rating: '0',
            totalReviews: 0,
            fanCount: 0,
            preferences: {},
            settings: {},
            lastActive: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return {
            ...result.venues,
            company
        };
    }
    async getVenues(filters = {}) {
        const companyAlias = alias(users, 'company');
        const query = this.db
            .select()
            .from(venues)
            .leftJoin(companyAlias, eq(venues.companyId, companyAlias.id));
        if (filters.companyId !== undefined) {
            query.where(eq(venues.companyId, filters.companyId));
        }
        const results = await query;
        return results.map(result => {
            // Create a proper company object with all required fields
            const company = result.company || {
                id: '',
                email: '',
                password: null,
                firstName: '',
                lastName: null,
                displayName: null,
                profileImageUrl: null,
                coverImageUrl: null,
                userType: 'company',
                bio: null,
                city: null,
                address: null,
                phone: null,
                website: null,
                socialMedia: null,
                isVerified: false,
                isFeatured: false,
                isAvailable: true,
                rating: '0',
                totalReviews: 0,
                fanCount: 0,
                preferences: {},
                settings: {},
                lastActive: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return {
                ...result.venues,
                company
            };
        });
    }
    async createVenue(data) {
        const [result] = await this.db.insert(venues).values(data).returning();
        return result;
    }
    async updateVenue(id, data) {
        const [result] = await this.db
            .update(venues)
            .set(data)
            .where(eq(venues.id, id))
            .returning();
        return result;
    }
    async deleteVenue(id) {
        await this.db.delete(venues).where(eq(venues.id, id));
    }
}
