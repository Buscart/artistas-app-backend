import { db } from '../db.js';
import { and, eq, gte, lte, or, sql, desc, inArray, ilike, isNull } from 'drizzle-orm';
import { users, artists, events, venues, services, artworks, categories, highlightPhotos } from '../schema/index.js';

// DTOs para tipado seguro
export interface ExplorerFilters {
  query?: string;
  city?: string;
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  discipline?: string;
  role?: string;
  sortBy?: 'rating' | 'price' | 'newest' | 'distance';
  limit?: number;
  offset?: number;
  availableToday?: boolean;
}

export interface ExplorerResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Cache simple en memoria (production: Redis)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

class ExplorerService {
  private getCacheKey(type: string, filters: ExplorerFilters): string {
    return `explorer:${type}:${JSON.stringify(filters)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private buildArtistConditions(filters: ExplorerFilters) {
    const conditions: any[] = [
      eq(users.userType, 'artist'),
      eq(users.isAvailable, true)
    ];

    if (filters.city) {
      conditions.push(eq(users.city, filters.city));
    }

    if (filters.category) {
      const categoryId = parseInt(filters.category);
      if (!isNaN(categoryId)) {
        conditions.push(eq(artists.categoryId, categoryId));
      }
    }

    if (filters.discipline) {
      conditions.push(
        or(
          sql`LOWER(${artists.artistType}::text) LIKE LOWER(${`%${filters.discipline}%`}::text)`,
          sql`${artists.tags}::text ILIKE ${`%${filters.discipline}%`}`
        )
      );
    }

    if (filters.role) {
      conditions.push(
        sql`LOWER(${artists.artistType}::text) LIKE LOWER(${`%${filters.role}%`}::text)`
      );
    }

    if (filters.maxPrice) {
      conditions.push(lte(artists.pricePerHour, filters.maxPrice.toString()));
    }

    if (filters.minPrice) {
      conditions.push(gte(artists.pricePerHour, filters.minPrice.toString()));
    }

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        or(
          sql`LOWER(${users.firstName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.lastName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.displayName}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${users.bio}::text) LIKE LOWER(${searchTerm}::text)`
        )
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async getArtists(filters: ExplorerFilters = {}): Promise<ExplorerResponse<any>> {
    const cacheKey = this.getCacheKey('artists', filters);
    const cached = this.getFromCache<ExplorerResponse<any>>(cacheKey);
    if (cached) return cached;

    const whereCondition = this.buildArtistConditions(filters);
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    // Query optimizada con JOIN y subquery para fotos
    const artistsQuery = db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        bio: users.bio,
        rating: users.rating,
        totalReviews: users.totalReviews,
        isVerified: users.isVerified,
        isAvailable: users.isAvailable,
        website: users.website,
        socialMedia: users.socialMedia,
        artistData: {
          id: artists.id,
          artistName: artists.artistName,
          stageName: artists.stageName,
          categoryId: artists.categoryId,
          tags: artists.tags,
          pricePerHour: artists.pricePerHour,
          baseCity: artists.baseCity,
          yearsOfExperience: artists.yearsOfExperience,
          artistType: artists.artistType,
          travelAvailability: artists.travelAvailability,
          travelDistance: artists.travelDistance,
          hourlyRate: artists.hourlyRate,
          pricingType: artists.pricingType,
          priceRange: artists.priceRange,
          availability: artists.availability,
          languages: artists.languages,
        },
        // Subquery para obtener fotos destacadas en una sola query
        highlightPhotos: sql<(string[])>`(
          SELECT COALESCE(array_agg(image_url ORDER BY position), ARRAY[]::text[])
          FROM highlight_photos 
          WHERE highlight_photos.user_id = users.id 
          AND image_url IS NOT NULL 
          LIMIT 4
        )`.as('highlightPhotos'),
      })
      .from(users)
      .leftJoin(artists, eq(users.id, artists.userId))
      .where(whereCondition)
      .orderBy(
        filters.sortBy === 'price' ? artists.pricePerHour :
        filters.sortBy === 'newest' ? desc(users.createdAt) :
        desc(users.rating)
      )
      .limit(limit)
      .offset(offset);

    // Query para conteo total
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(artists, eq(users.id, artists.userId))
      .where(whereCondition);

    // Ejecutar queries en paralelo
    const [artistsList, totalResult] = await Promise.all([artistsQuery, countQuery]);

    const total = Number(totalResult[0]?.count) || 0;
    const hasMore = offset + limit < total;

    const result = {
      data: artistsList,
      pagination: { total, limit, offset, hasMore }
    };

    // Cachear resultado
    this.setCache(cacheKey, result, 5 * 60 * 1000); // 5 minutos

    return result;
  }

  async getEvents(filters: ExplorerFilters = {}): Promise<ExplorerResponse<any>> {
    const cacheKey = this.getCacheKey('events', filters);
    const cached = this.getFromCache<ExplorerResponse<any>>(cacheKey);
    if (cached) return cached;

    const conditions = [
      eq(events.status, 'published'),
      gte(events.startDate, new Date())
    ];

    if (filters.city) {
      conditions.push(eq(events.city, filters.city));
    }

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        or(
          sql`LOWER(${events.title}::text) LIKE LOWER(${searchTerm}::text)`,
          sql`LOWER(${events.description}::text) LIKE LOWER(${searchTerm}::text)`
        )
      );
    }

    const whereCondition = and(...conditions);
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const [eventsList, totalResult] = await Promise.all([
      db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          description: events.description,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          city: events.city,
          address: events.address,
          featuredImage: events.featuredImage,
          gallery: events.gallery,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          tags: events.tags,
          eventType: events.eventType,
          capacity: events.capacity,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(whereCondition)
        .orderBy(events.startDate)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(events)
        .where(whereCondition)
    ]);

    const total = Number(totalResult[0]?.count) || 0;
    const hasMore = offset + limit < total;

    const result = {
      data: eventsList,
      pagination: { total, limit, offset, hasMore }
    };

    this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutos para eventos

    return result;
  }

  // Métodos similares para venues, services, artworks...
  async getVenues(filters: ExplorerFilters = {}): Promise<ExplorerResponse<any>> {
    // Implementación similar a getArtists
    const cacheKey = this.getCacheKey('venues', filters);
    const cached = this.getFromCache<ExplorerResponse<any>>(cacheKey);
    if (cached) return cached;

    // ... implementación optimizada
    return { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
  }

  async getServices(filters: ExplorerFilters = {}): Promise<ExplorerResponse<any>> {
    // Implementación similar
    return { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
  }

  async getArtworks(filters: ExplorerFilters = {}): Promise<ExplorerResponse<any>> {
    // Implementación similar
    return { data: [], pagination: { total: 0, limit: 20, offset: 0, hasMore: false } };
  }

  async getServicesByUserId(userId: string): Promise<any[]> {
    return db
      .select()
      .from(services)
      .where(and(eq(services.userId, userId), eq(services.isActive, true)))
      .orderBy(desc(services.createdAt));
  }

  async createService(userId: string, body: any): Promise<any> {
    const [created] = await db
      .insert(services)
      .values({ ...body, userId })
      .returning();
    return created;
  }

  async updateService(userId: string, id: number, body: any): Promise<any | null> {
    const [updated] = await db
      .update(services)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(services.id, id), eq(services.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async deleteService(userId: string, id: number): Promise<void> {
    await db
      .update(services)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(services.id, id), eq(services.userId, userId)));
  }

  // Limpiar caché
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }
}

export const explorerService = new ExplorerService();
