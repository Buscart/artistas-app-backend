import { db } from '../db.js';
import { recommendations, users, blogPosts } from '../schema.js';
import { eq, and, or, like, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type RecommendationWithUser = typeof recommendations.$inferSelect & {
  user: typeof users.$inferSelect;
  post?: typeof blogPosts.$inferSelect;
};

export class RecommendationStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  async getRecommendations(filters: { 
    artistId?: number;
    eventId?: number;
    postId?: number;
    isActive?: boolean;
    search?: string;
    type?: 'artist' | 'event' | 'venue' | 'post';
  } = {}): Promise<RecommendationWithUser[]> {
    const userAlias = alias(users, 'user');
    const conditions = [];

    // Construir condiciones basadas en los filtros
    if (filters.artistId) {
      conditions.push(eq(recommendations.artistId, filters.artistId));
    }
    
    if (filters.eventId) {
      conditions.push(eq(recommendations.eventId, filters.eventId));
    }
    
    if (filters.postId) {
      conditions.push(eq(recommendations.postId, filters.postId));
    }
    
    if (typeof filters.isActive !== 'undefined') {
      conditions.push(eq(recommendations.isActive, filters.isActive));
    }
    
    if (filters.type) {
      conditions.push(eq(recommendations.type, filters.type));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(recommendations.title, `%${filters.search}%`),
          like(recommendations.content, `%${filters.search}%`)
        )
      );
    }

    // Construir la consulta base
    const query = this.db
      .select({
        recommendation: recommendations,
        user: userAlias,
      })
      .from(recommendations)
      .leftJoin(userAlias, eq(recommendations.userId, userAlias.id));

    // Aplicar condiciones si existen
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query.where(eq(recommendations.isActive, true));

    // Ejecutar la consulta
    const results = await finalQuery.execute();
    
    return results.map(r => ({
      ...r.recommendation,
      user: r.user!
    }));
  }

  async createRecommendation(
    data: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    // Validar que si es de tipo 'post', tenga un postId válido
    if (data.type === 'post' && !data.postId) {
      throw new Error('Post ID is required for recommendations of type "post"');
    }

    // Si es de otro tipo, asegurarse de que no tenga postId
    if (data.type !== 'post' && data.postId) {
      throw new Error('Post ID should only be provided for recommendations of type "post"');
    }

    const [result] = await this.db
      .insert(recommendations)
      .values({
        ...data,
        isActive: data.isActive ?? true,
        isApproved: data.isApproved ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return await this.getRecommendationById(result.id) as RecommendationWithUser;
  }

  async getRecommendationById(id: number): Promise<RecommendationWithUser | null> {
    const userAlias = alias(users, 'user');
    const postAlias = alias(blogPosts, 'post');
    
    const [result] = await this.db
      .select({
        recommendation: recommendations,
        user: userAlias,
        post: postAlias
      })
      .from(recommendations)
      .leftJoin(userAlias, eq(recommendations.userId, userAlias.id))
      .leftJoin(postAlias, eq(recommendations.postId, postAlias.id))
      .where(eq(recommendations.id, id))
      .execute();

    if (!result) return null;
    
    return {
      ...result.recommendation,
      user: result.user!,
      post: result.post || undefined
    };
  }

  async updateRecommendation(
    id: number, 
    data: Partial<Omit<typeof recommendations.$inferInsert, 'id' | 'userId' | 'createdAt'>>
  ) {
    // Validar que si se está actualizando el tipo a 'post', se proporcione un postId
    if (data.type === 'post' && !data.postId) {
      throw new Error('Post ID is required when updating to type "post"');
    }

    // Si se está actualizando el postId, asegurarse de que el tipo sea 'post'
    if (data.postId) {
      const current = await this.getRecommendationById(id);
      if (!current) throw new Error('Recommendation not found');
      
      if (current.type !== 'post' && data.type !== 'post') {
        throw new Error('Cannot set postId for non-post recommendations');
      }
    }

    const [result] = await this.db
      .update(recommendations)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(recommendations.id, id))
      .returning();

    if (!result) throw new Error('Failed to update recommendation');
    return await this.getRecommendationById(result.id);
  }

  async deleteRecommendation(id: number): Promise<boolean> {
    const [result] = await this.db
      .delete(recommendations)
      .where(eq(recommendations.id, id))
      .returning({ id: recommendations.id });
    
    return !!result;
  }

  // Métodos específicos para recomendaciones de posts
  async getPostRecommendations(postId: number, filters: {
    isActive?: boolean;
    isApproved?: boolean;
  } = {}): Promise<RecommendationWithUser[]> {
    return this.getRecommendations({
      ...filters,
      postId,
      type: 'post'
    });
  }

  async createPostRecommendation(
    postId: number,
    data: Omit<typeof recommendations.$inferInsert, 'id' | 'postId' | 'type' | 'createdAt' | 'updatedAt'>
  ) {
    return this.createRecommendation({
      ...data,
      postId,
      type: 'post'
    });
  }

}

export const recommendationStorage = new RecommendationStorage(db);
