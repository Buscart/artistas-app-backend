import { db } from '../db.js';
import { sql } from 'drizzle-orm';
export class SocialService {
    /**
     * Obtiene usuarios sugeridos para seguir basándose en intereses comunes, etc.
     * @param userId ID del usuario actual
     * @param limit Número de usuarios a obtener
     */
    static async getSuggestedUsers(userId, limit = 3) {
        try {
            console.log('🔍 getSuggestedUsers - userId:', userId, 'limit:', limit);
            const result = await db.execute(sql `
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name AS name,
          u.username,
          u.profile_image_url AS avatar,
          CASE WHEN u.is_verified = true THEN true ELSE false END AS verified,
          u.bio
        FROM users u
        WHERE u.id != ${userId}
          AND u.id NOT IN (
            SELECT following_id FROM follows WHERE follower_id = ${userId}
          )
        ORDER BY RANDOM()
        LIMIT ${limit}
      `);
            // postgres.js devuelve directamente un array, no un objeto con .rows
            const rows = Array.isArray(result) ? result : result.rows || [];
            console.log('✅ Found suggested users:', rows.length);
            console.log('📋 Users:', rows);
            return rows;
        }
        catch (error) {
            console.error('❌ Error getting suggested users:', error);
            return [];
        }
    }
    /**
     * Obtiene los temas en tendencia basándose en hashtags más usados
     * @param limit Número de tendencias a obtener
     */
    static async getTrendingTopics(limit = 4) {
        try {
            // Obtener hashtags más usados en las últimas 7 días
            const result = await db.execute(sql `
        SELECT
          h.tag AS topic,
          h.use_count AS count,
          CASE
            WHEN h.use_count >= 1000 THEN ROUND(h.use_count / 1000.0, 1) || 'K publicaciones'
            ELSE h.use_count || ' publicaciones'
          END AS posts
        FROM hashtags h
        WHERE h.updated_at >= NOW() - INTERVAL '7 days'
        ORDER BY h.use_count DESC, h.updated_at DESC
        LIMIT ${limit}
      `);
            // postgres.js devuelve directamente un array
            const rows = Array.isArray(result) ? result : result.rows || [];
            // Si no hay hashtags suficientes, agregar tendencias por defecto
            if (rows.length < limit) {
                const defaultTrends = [
                    { topic: 'Arte', posts: '2.5K publicaciones', count: 2500 },
                    { topic: 'Música', posts: '1.8K publicaciones', count: 1800 },
                    { topic: 'Fotografía', posts: '3.2K publicaciones', count: 3200 },
                    { topic: 'Teatro', posts: '1.2K publicaciones', count: 1200 },
                    { topic: 'Danza', posts: '980 publicaciones', count: 980 },
                    { topic: 'Cine', posts: '1.5K publicaciones', count: 1500 },
                ];
                const needed = limit - rows.length;
                const combined = [...rows, ...defaultTrends.slice(0, needed)];
                return combined.slice(0, limit);
            }
            return rows;
        }
        catch (error) {
            console.error('Error getting trending topics:', error);
            // Fallback a tendencias por defecto si hay error
            const fallbackTrends = [
                { topic: 'Arte', posts: '2.5K publicaciones', count: 2500 },
                { topic: 'Música', posts: '1.8K publicaciones', count: 1800 },
                { topic: 'Fotografía', posts: '3.2K publicaciones', count: 3200 },
                { topic: 'Teatro', posts: '1.2K publicaciones', count: 1200 },
            ];
            return fallbackTrends.slice(0, limit);
        }
    }
    /**
     * Sigue a un usuario
     * @param followerId ID del usuario que sigue
     * @param followingId ID del usuario a seguir
     */
    static async followUser(followerId, followingId) {
        await db.execute(sql `
      INSERT INTO follows (follower_id, following_id)
      VALUES (${followerId}, ${followingId})
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `);
    }
    /**
     * Deja de seguir a un usuario
     * @param followerId ID del usuario que deja de seguir
     * @param followingId ID del usuario a dejar de seguir
     */
    static async unfollowUser(followerId, followingId) {
        await db.execute(sql `
      DELETE FROM follows
      WHERE follower_id = ${followerId} AND following_id = ${followingId}
    `);
    }
}
