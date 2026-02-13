import { db } from '../db.js';
import { userContracts, userQuotations } from '../schema.js';
import { eq, and, or, desc, sql } from 'drizzle-orm';
export class UserContractsStorage {
    constructor(db) {
        this.db = db;
    }
    // ============ CONTRATACIONES ============
    /**
     * Obtener historial de contrataciones del usuario (como cliente o artista)
     */
    async getUserContracts(userId, options) {
        const role = options?.role || 'both';
        // Construir condición de usuario según el rol
        let userCondition;
        if (role === 'client') {
            userCondition = eq(userContracts.userId, userId);
        }
        else if (role === 'artist') {
            userCondition = eq(userContracts.artistId, userId);
        }
        else {
            // both - incluir contratos donde sea cliente o artista
            userCondition = or(eq(userContracts.userId, userId), eq(userContracts.artistId, userId));
        }
        const conditions = [userCondition];
        if (options?.status) {
            conditions.push(eq(userContracts.status, options.status));
        }
        let query = this.db
            .select()
            .from(userContracts)
            .where(and(...conditions))
            .orderBy(desc(userContracts.createdAt));
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return await query;
    }
    /**
     * Obtener una contratación por ID
     */
    async getContractById(contractId) {
        const [contract] = await this.db
            .select()
            .from(userContracts)
            .where(eq(userContracts.id, contractId));
        return contract || null;
    }
    /**
     * Crear nueva contratación
     */
    async createContract(data) {
        const [contract] = await this.db
            .insert(userContracts)
            .values(data)
            .returning();
        if (!contract) {
            throw new Error('Failed to create contract');
        }
        return contract;
    }
    /**
     * Actualizar estado de contratación
     */
    async updateContractStatus(contractId, status, additionalData) {
        const [updated] = await this.db
            .update(userContracts)
            .set({
            status: status,
            ...additionalData,
            updatedAt: new Date(),
        })
            .where(eq(userContracts.id, contractId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update contract status');
        }
        return updated;
    }
    /**
     * Agregar reseña a contratación
     */
    async addReview(contractId, rating, review) {
        const [updated] = await this.db
            .update(userContracts)
            .set({
            rating,
            review,
            updatedAt: new Date(),
        })
            .where(eq(userContracts.id, contractId))
            .returning();
        if (!updated) {
            throw new Error('Failed to add review');
        }
        return updated;
    }
    /**
     * Obtener estadísticas de contrataciones
     */
    async getContractStats(userId) {
        // Total de contrataciones
        const [totalResult] = await this.db
            .select({ count: sql `count(*)::int` })
            .from(userContracts)
            .where(eq(userContracts.userId, userId));
        // Total gastado
        const [spentResult] = await this.db
            .select({ total: sql `coalesce(sum(amount), 0)::numeric` })
            .from(userContracts)
            .where(and(eq(userContracts.userId, userId), eq(userContracts.status, 'completed')));
        // Contrataciones completadas
        const [completedResult] = await this.db
            .select({ count: sql `count(*)::int` })
            .from(userContracts)
            .where(and(eq(userContracts.userId, userId), eq(userContracts.status, 'completed')));
        // Contrataciones pendientes
        const [pendingResult] = await this.db
            .select({ count: sql `count(*)::int` })
            .from(userContracts)
            .where(and(eq(userContracts.userId, userId), eq(userContracts.status, 'pending')));
        // Contrataciones canceladas
        const [cancelledResult] = await this.db
            .select({ count: sql `count(*)::int` })
            .from(userContracts)
            .where(and(eq(userContracts.userId, userId), eq(userContracts.status, 'cancelled')));
        // Rating promedio
        const [ratingResult] = await this.db
            .select({ avg: sql `coalesce(avg(rating), 0)::numeric` })
            .from(userContracts)
            .where(and(eq(userContracts.userId, userId), sql `${userContracts.rating} IS NOT NULL`));
        return {
            totalContracts: totalResult?.count || 0,
            totalSpent: parseFloat(spentResult?.total?.toString() || '0'),
            completedContracts: completedResult?.count || 0,
            pendingContracts: pendingResult?.count || 0,
            cancelledContracts: cancelledResult?.count || 0,
            averageRating: parseFloat(ratingResult?.avg?.toString() || '0'),
        };
    }
    // ============ COTIZACIONES ============
    /**
     * Obtener cotizaciones del usuario
     */
    async getUserQuotations(userId, options) {
        const conditions = [eq(userQuotations.userId, userId)];
        if (options?.status) {
            conditions.push(eq(userQuotations.status, options.status));
        }
        let query = this.db
            .select()
            .from(userQuotations)
            .where(and(...conditions))
            .orderBy(desc(userQuotations.createdAt));
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return await query;
    }
    /**
     * Obtener una cotización por ID
     */
    async getQuotationById(quotationId) {
        const [quotation] = await this.db
            .select()
            .from(userQuotations)
            .where(eq(userQuotations.id, quotationId));
        return quotation || null;
    }
    /**
     * Crear solicitud de cotización
     */
    async createQuotation(data) {
        const [quotation] = await this.db
            .insert(userQuotations)
            .values(data)
            .returning();
        if (!quotation) {
            throw new Error('Failed to create quotation');
        }
        return quotation;
    }
    /**
     * Actualizar estado de cotización
     */
    async updateQuotationStatus(quotationId, status, additionalData) {
        const [updated] = await this.db
            .update(userQuotations)
            .set({
            status: status,
            ...additionalData,
            updatedAt: new Date(),
        })
            .where(eq(userQuotations.id, quotationId))
            .returning();
        if (!updated) {
            throw new Error('Failed to update quotation status');
        }
        return updated;
    }
    /**
     * Responder a cotización (desde el artista)
     */
    async respondToQuotation(quotationId, quotedAmount, artistResponse) {
        const [updated] = await this.db
            .update(userQuotations)
            .set({
            status: 'quoted',
            quotedAmount: quotedAmount.toString(),
            artistResponse,
            responseDate: new Date(),
            updatedAt: new Date(),
        })
            .where(eq(userQuotations.id, quotationId))
            .returning();
        if (!updated) {
            throw new Error('Failed to respond to quotation');
        }
        return updated;
    }
    /**
     * Aceptar cotización (convertir en contrato)
     */
    async acceptQuotation(quotationId) {
        const quotation = await this.getQuotationById(quotationId);
        if (!quotation) {
            throw new Error('Quotation not found');
        }
        // Actualizar cotización
        const [updatedQuotation] = await this.db
            .update(userQuotations)
            .set({
            status: 'accepted',
            updatedAt: new Date(),
        })
            .where(eq(userQuotations.id, quotationId))
            .returning();
        // Crear contrato
        const contract = await this.createContract({
            userId: quotation.userId,
            artistId: quotation.artistId,
            serviceType: quotation.serviceType,
            serviceName: quotation.title,
            description: quotation.description,
            amount: quotation.quotedAmount?.toString() || '0',
            status: 'confirmed',
            serviceDate: quotation.preferredDate,
            metadata: {
                quotationId: quotation.id,
                ...(quotation.metadata || {}),
            },
        });
        return {
            quotation: updatedQuotation,
            contract,
        };
    }
}
export const userContractsStorage = new UserContractsStorage(db);
