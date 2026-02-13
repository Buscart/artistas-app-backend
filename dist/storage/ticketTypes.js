import { db } from '../db.js';
import { ticketTypes } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
export class TicketTypeStorage {
    constructor(db) {
        this.db = db;
    }
    /**
     * Get all ticket types for an event
     */
    async getTicketTypesByEventId(eventId) {
        const results = await this.db
            .select()
            .from(ticketTypes)
            .where(eq(ticketTypes.eventId, eventId))
            .orderBy(ticketTypes.createdAt);
        return results;
    }
    /**
     * Get a specific ticket type by ID
     */
    async getTicketType(id) {
        const [ticketType] = await this.db
            .select()
            .from(ticketTypes)
            .where(eq(ticketTypes.id, id))
            .limit(1);
        return ticketType;
    }
    /**
     * Get a ticket type by ID and event ID (for authorization)
     */
    async getTicketTypeByEventId(id, eventId) {
        const [ticketType] = await this.db
            .select()
            .from(ticketTypes)
            .where(and(eq(ticketTypes.id, id), eq(ticketTypes.eventId, eventId)))
            .limit(1);
        return ticketType;
    }
    /**
     * Create a new ticket type
     */
    async createTicketType(data) {
        const [ticketType] = await this.db
            .insert(ticketTypes)
            .values({
            ...data,
            soldCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning();
        return ticketType;
    }
    /**
     * Create multiple ticket types at once (for event creation)
     */
    async createBulkTicketTypes(eventId, ticketTypesData) {
        if (ticketTypesData.length === 0) {
            return [];
        }
        const values = ticketTypesData.map(data => ({
            ...data,
            eventId,
            soldCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        const results = await this.db
            .insert(ticketTypes)
            .values(values)
            .returning();
        return results;
    }
    /**
     * Update a ticket type
     */
    async updateTicketType(id, data) {
        const [ticketType] = await this.db
            .update(ticketTypes)
            .set({
            ...data,
            updatedAt: new Date(),
        })
            .where(eq(ticketTypes.id, id))
            .returning();
        return ticketType;
    }
    /**
     * Delete a ticket type
     */
    async deleteTicketType(id) {
        await this.db.delete(ticketTypes).where(eq(ticketTypes.id, id));
    }
    /**
     * Increment sold count when a ticket is purchased
     */
    async incrementSoldCount(id, quantity = 1) {
        await this.db
            .update(ticketTypes)
            .set({
            soldCount: sql `${ticketTypes.soldCount} + ${quantity}`,
            updatedAt: new Date(),
        })
            .where(eq(ticketTypes.id, id));
    }
    /**
     * Decrement sold count when a ticket is refunded
     */
    async decrementSoldCount(id, quantity = 1) {
        await this.db
            .update(ticketTypes)
            .set({
            soldCount: sql `GREATEST(0, ${ticketTypes.soldCount} - ${quantity})`,
            updatedAt: new Date(),
        })
            .where(eq(ticketTypes.id, id));
    }
    /**
     * Get available ticket count
     */
    async getAvailableCount(id) {
        const [ticketType] = await this.db
            .select({
            available: sql `${ticketTypes.quantity} - ${ticketTypes.soldCount}`,
        })
            .from(ticketTypes)
            .where(eq(ticketTypes.id, id))
            .limit(1);
        return ticketType?.available || 0;
    }
    /**
     * Check if tickets are available for purchase
     */
    async checkAvailability(id, requestedQuantity) {
        const available = await this.getAvailableCount(id);
        return available >= requestedQuantity;
    }
    /**
     * Get statistics for all ticket types of an event
     */
    async getEventTicketStats(eventId) {
        const [stats] = await this.db
            .select({
            totalTickets: sql `SUM(${ticketTypes.quantity})`,
            soldTickets: sql `SUM(${ticketTypes.soldCount})`,
            availableTickets: sql `SUM(${ticketTypes.quantity} - ${ticketTypes.soldCount})`,
            revenue: sql `SUM(${ticketTypes.soldCount} * ${ticketTypes.price})`,
        })
            .from(ticketTypes)
            .where(eq(ticketTypes.eventId, eventId));
        return {
            totalTickets: Number(stats?.totalTickets || 0),
            soldTickets: Number(stats?.soldTickets || 0),
            availableTickets: Number(stats?.availableTickets || 0),
            revenue: Number(stats?.revenue || 0),
        };
    }
}
export const ticketTypeStorage = new TicketTypeStorage(db);
