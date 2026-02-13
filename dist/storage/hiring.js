import { db } from '../db.js';
import { eq, and, desc } from 'drizzle-orm';
import { hiringRequests, hiringResponses, userContracts } from '../schema.js';
export class HiringStorage {
    constructor(db) {
        this.db = db;
    }
    async getActiveHiringRequests() {
        const results = await this.db
            .select()
            .from(hiringRequests)
            .where(eq(hiringRequests.status, 'pending'));
        return results;
    }
    async getHiringRequest(id) {
        const [result] = await this.db
            .select()
            .from(hiringRequests)
            .where(eq(hiringRequests.id, id));
        if (!result)
            return undefined;
        const responses = await this.db
            .select()
            .from(hiringResponses)
            .where(eq(hiringResponses.requestId, id));
        return {
            ...result,
            responses
        };
    }
    async createHiringRequest(request) {
        const [result] = await this.db
            .insert(hiringRequests)
            .values({
            clientId: request.clientId,
            artistId: request.artistId,
            venueId: request.venueId,
            eventDate: request.eventDate.toLocaleDateString('en-CA'),
            details: request.details,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        })
            .returning();
        return result;
    }
    async createHiringResponse(response) {
        const status = response.accepted ? 'accepted' : 'rejected';
        const [result] = await this.db
            .insert(hiringResponses)
            .values({
            requestId: response.requestId,
            artistId: response.artistId,
            proposal: response.proposal,
            message: response.message,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
        })
            .returning();
        await this.db
            .update(hiringRequests)
            .set({
            status,
            updatedAt: new Date()
        })
            .where(eq(hiringRequests.id, response.requestId));
        return result;
    }
    /**
     * Obtener ofertas publicadas por un cliente específico
     */
    async getMyHiringRequests(clientId, options) {
        const conditions = [eq(hiringRequests.clientId, clientId)];
        if (options?.status) {
            conditions.push(eq(hiringRequests.status, options.status));
        }
        let query = this.db
            .select()
            .from(hiringRequests)
            .where(and(...conditions))
            .orderBy(desc(hiringRequests.createdAt));
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return await query;
    }
    /**
     * Actualizar una oferta de hiring
     */
    async updateHiringRequest(id, data) {
        const [result] = await this.db
            .update(hiringRequests)
            .set({
            ...data,
            updatedAt: new Date()
        })
            .where(eq(hiringRequests.id, id))
            .returning();
        return result;
    }
    /**
     * Eliminar una oferta de hiring
     */
    async deleteHiringRequest(id) {
        // Primero eliminar las respuestas asociadas
        await this.db
            .delete(hiringResponses)
            .where(eq(hiringResponses.requestId, id));
        // Luego eliminar la oferta
        const [result] = await this.db
            .delete(hiringRequests)
            .where(eq(hiringRequests.id, id))
            .returning();
        return result;
    }
    /**
     * Obtener todas las respuestas a una oferta específica
     */
    async getHiringResponsesByRequest(requestId) {
        const results = await this.db
            .select()
            .from(hiringResponses)
            .where(eq(hiringResponses.requestId, requestId))
            .orderBy(desc(hiringResponses.createdAt));
        return results;
    }
    /**
     * Actualizar el estado de una respuesta (postulación)
     */
    async updateHiringResponse(id, status) {
        const [result] = await this.db
            .update(hiringResponses)
            .set({
            status,
            updatedAt: new Date()
        })
            .where(eq(hiringResponses.id, id))
            .returning();
        return result;
    }
    /**
     * Aceptar una postulación y crear un contrato
     */
    async acceptHiringResponse(responseId) {
        // Obtener la respuesta
        const [response] = await this.db
            .select()
            .from(hiringResponses)
            .where(eq(hiringResponses.id, responseId));
        if (!response) {
            throw new Error('Response not found');
        }
        // Obtener la oferta original
        const [request] = await this.db
            .select()
            .from(hiringRequests)
            .where(eq(hiringRequests.id, response.requestId));
        if (!request) {
            throw new Error('Hiring request not found');
        }
        // Actualizar estado de la respuesta
        await this.updateHiringResponse(responseId, 'accepted');
        // Actualizar estado de la oferta
        await this.db
            .update(hiringRequests)
            .set({
            status: 'accepted',
            updatedAt: new Date()
        })
            .where(eq(hiringRequests.id, response.requestId));
        // Crear contrato
        const [contract] = await this.db
            .insert(userContracts)
            .values({
            userId: request.clientId,
            artistId: response.artistId.toString(), // Convertir a string
            serviceType: 'hiring',
            serviceName: 'Oferta de Trabajo',
            description: request.details,
            amount: request.budget?.toString() || '0',
            status: 'confirmed',
            serviceDate: request.eventDate ? new Date(request.eventDate) : undefined,
            metadata: {
                hiringRequestId: request.id,
                hiringResponseId: response.id,
                proposal: response.proposal
            }
        })
            .returning();
        return {
            response,
            request,
            contract
        };
    }
}
export const hiringStorage = new HiringStorage(db);
