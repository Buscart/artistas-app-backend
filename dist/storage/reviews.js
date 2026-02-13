import { eq, and } from 'drizzle-orm';
import { reviews } from '../schema.js';
export class ReviewStorage {
    constructor(db) {
        this.db = db;
    }
    async getReviews(targetType, targetId) {
        const results = await this.db
            .select({
            id: reviews.id,
            userId: reviews.userId,
            type: reviews.type,
            score: reviews.score,
            reason: reviews.reason,
            artistId: reviews.artistId,
            eventId: reviews.eventId,
            venueId: reviews.venueId,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt
        })
            .from(reviews)
            .where(targetType === 'artist'
            ? eq(reviews.artistId, targetId)
            : targetType === 'event'
                ? eq(reviews.eventId, targetId)
                : eq(reviews.venueId, targetId));
        return results;
    }
    async canUserReview(userId, targetType, targetId) {
        const existingReview = await this.db
            .select()
            .from(reviews)
            .where(and(eq(reviews.userId, userId), targetType === 'artist'
            ? eq(reviews.artistId, targetId)
            : targetType === 'event'
                ? eq(reviews.eventId, targetId)
                : eq(reviews.venueId, targetId)));
        return existingReview.length === 0;
    }
    async createReview(review) {
        const [result] = await this.db
            .insert(reviews)
            .values({
            userId: review.userId,
            type: review.type,
            score: review.score,
            reason: review.reason,
            artistId: review.artistId || null,
            eventId: review.eventId || null,
            venueId: review.venueId || null,
            createdAt: new Date()
        })
            .returning();
        return result;
    }
}
