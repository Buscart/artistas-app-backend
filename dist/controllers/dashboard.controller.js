import { storage } from '../storage/index.js';
import { eq, count } from 'drizzle-orm';
import { userActivities, blogPosts, blogComments, blogPostLikes, userQuotations, userContracts } from '../schema.js';
export const dashboardController = {
    async getStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No autorizado',
                    error: 'UNAUTHORIZED'
                });
            }
            // Obtener estadísticas básicas
            const [[{ count: totalBlogPosts }], [{ count: totalComments }], [{ count: totalLikes }], [{ count: totalQuotes }], [{ count: totalContracts }]] = await Promise.all([
                storage.db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.authorId, userId)),
                storage.db.select({ count: count() }).from(blogComments).where(eq(blogComments.authorId, userId)),
                storage.db.select({ count: count() }).from(blogPostLikes).where(eq(blogPostLikes.userId, userId)),
                storage.db.select({ count: count() }).from(userQuotations).where(eq(userQuotations.userId, userId)),
                storage.db.select({ count: count() }).from(userContracts).where(eq(userContracts.userId, userId))
            ]);
            // Obtener las últimas actividades
            const recentActivities = await storage.db
                .select()
                .from(userActivities)
                .where(eq(userActivities.userId, userId))
                .orderBy(userActivities.createdAt)
                .limit(5);
            return res.json({
                success: true,
                data: {
                    stats: {
                        totalBlogPosts: Number(totalBlogPosts) || 0,
                        totalComments: Number(totalComments) || 0,
                        totalLikes: Number(totalLikes) || 0,
                        totalQuotes: Number(totalQuotes) || 0,
                        totalContracts: Number(totalContracts) || 0
                    },
                    recentActivities
                }
            });
        }
        catch (error) {
            console.error('❌ Error al obtener estadísticas del dashboard:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
};
