import { db } from '../db.js';
import { events, users, categories } from '../schema.js';
import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
export class EventStorage {
    constructor(db) {
        this.db = db;
    }
    async getEvent(id) {
        const organizerAlias = alias(users, 'organizer');
        const categoryAlias = alias(categories, 'category');
        const result = await this.db
            .select({
            // Seleccionar todos los campos de events
            ...Object.fromEntries(Object.entries(events).map(([key, value]) => [key, events[key]])),
            organizer: organizerAlias,
            category: categoryAlias
        })
            .from(events)
            .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
            .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id))
            .where(and(eq(events.id, id), isNotNull(organizerAlias.id)))
            .limit(1);
        if (result.length === 0)
            return undefined;
        const row = result[0];
        if (!row.organizer)
            return undefined;
        // Extraer los campos del evento (todos excepto organizer y category)
        const { organizer, category, ...eventData } = row;
        return {
            ...eventData,
            organizer,
            category: category || undefined
        };
    }
    async getEvents(filters = {}) {
        const organizerAlias = alias(users, 'organizer');
        const categoryAlias = alias(categories, 'category');
        const conditions = [isNotNull(organizerAlias.id)];
        if (filters.organizerId) {
            conditions.push(eq(events.organizerId, filters.organizerId));
        }
        if (filters.categoryId) {
            conditions.push(eq(events.categoryId, filters.categoryId));
        }
        if (filters.startDate) {
            conditions.push(sql `${events.startDate} >= ${filters.startDate}`);
        }
        if (filters.endDate) {
            conditions.push(sql `${events.endDate} <= ${filters.endDate}`);
        }
        const results = await this.db
            .select({
            event: events,
            organizer: organizerAlias,
            category: categoryAlias
        })
            .from(events)
            .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
            .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id))
            .where(and(...conditions));
        // Map the results to the expected format
        return results
            .filter((row) => !!row.organizer)
            .map(({ event, organizer, category }) => ({
            ...event,
            organizer,
            category: category || undefined
        }));
    }
    async createEvent(data) {
        const description = data.description || '';
        const shortDescription = description.length > 300
            ? `${description.substring(0, 297)}...`
            : description;
        // Extract the event data, handling any special fields
        const eventData = {
            ...data,
            shortDescription,
            slug: data.slug || String(data.title).toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, ''),
            status: 'published',
            // Handle optional fields with proper typing
            ...('imageUrl' in data && { featuredImage: data.imageUrl }),
            ...('images' in data && { gallery: data.images }),
            ...('isPublic' in data && { isPublic: data.isPublic }),
            ...(data.capacity !== undefined && { availableTickets: data.capacity })
        };
        const [event] = await this.db
            .insert(events)
            .values({
            ...eventData,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        return event;
    }
    async updateEvent(id, data) {
        const updateData = { ...data };
        // Handle special fields if they exist
        if ('description' in updateData && updateData.description !== undefined) {
            const description = updateData.description || '';
            updateData.shortDescription = description.length > 300
                ? `${description.substring(0, 297)}...`
                : description;
        }
        // Handle image URL if provided
        if ('imageUrl' in updateData) {
            updateData.featuredImage = updateData.imageUrl || null;
            delete updateData.imageUrl;
        }
        // Handle images array if provided
        if ('images' in updateData) {
            updateData.gallery = updateData.images || [];
            delete updateData.images;
        }
        // Ensure we don't try to update the ID or timestamps
        delete updateData.id;
        delete updateData.createdAt;
        updateData.updatedAt = new Date();
        const [event] = await this.db
            .update(events)
            .set(updateData)
            .where(eq(events.id, id))
            .returning();
        return event;
    }
    async deleteEvent(id) {
        await this.db.delete(events).where(eq(events.id, id));
    }
}
export const eventStorage = new EventStorage(db);
