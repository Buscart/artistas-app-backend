import { db } from '../db.js';
import { userDocuments } from '../schema.js';
import { eq, and } from 'drizzle-orm';
export class DocumentStorage {
    constructor(db) {
        this.db = db;
    }
    async getUserDocuments(userId) {
        return await this.db
            .select()
            .from(userDocuments)
            .where(eq(userDocuments.userId, userId))
            .orderBy(userDocuments.uploadedAt);
    }
    async getDocument(id) {
        const [document] = await this.db
            .select()
            .from(userDocuments)
            .where(eq(userDocuments.id, id))
            .limit(1);
        return document;
    }
    async getDocumentByType(userId, documentType) {
        const [document] = await this.db
            .select()
            .from(userDocuments)
            .where(and(eq(userDocuments.userId, userId), eq(userDocuments.documentType, documentType)))
            .orderBy(userDocuments.uploadedAt)
            .limit(1);
        return document;
    }
    async createDocument(data) {
        const [document] = await this.db
            .insert(userDocuments)
            .values({
            userId: data.userId,
            documentType: data.documentType,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            expiryDate: data.expiryDate,
            status: 'pending',
            uploadedAt: new Date(),
        })
            .returning();
        return document;
    }
    async updateDocumentStatus(id, status, reviewedBy, rejectionReason) {
        const [document] = await this.db
            .update(userDocuments)
            .set({
            status,
            reviewedBy,
            reviewedAt: new Date(),
            rejectionReason,
            updatedAt: new Date(),
        })
            .where(eq(userDocuments.id, id))
            .returning();
        return document;
    }
    async deleteDocument(id, userId) {
        await this.db
            .delete(userDocuments)
            .where(and(eq(userDocuments.id, id), eq(userDocuments.userId, userId)));
    }
    async getDocumentsCount(userId, status) {
        const conditions = [eq(userDocuments.userId, userId)];
        if (status) {
            conditions.push(eq(userDocuments.status, status));
        }
        const results = await this.db
            .select()
            .from(userDocuments)
            .where(and(...conditions));
        return results.length;
    }
}
export const documentStorage = new DocumentStorage(db);
