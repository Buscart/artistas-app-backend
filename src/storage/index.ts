// External Dependencies
import { and, eq, isNotNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { InferSelectModel, SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Database Schema
import { db } from '../db.js';
import * as schema from '../schema.js';

// Storage Interfaces
import type { IStorage, StorageConfig } from './interfaces.js';

// Storage Implementations
import { RecommendationStorage } from './recommendations.js';
import { FavoriteStorage } from './favorites.js';
import { BlogStorage } from './blog.js';
import { ReviewStorage } from './reviews.js';
import { CategoryStorage } from './categories.js';
import { EventStorage } from './events.js';
import { UserStorage } from './users.js';
import { VenueStorage } from './venues.js';
import { ArtistStorage } from './artists.js';
import { MessageStorage } from './messages.js';
import { HiringStorage } from './hiring.js';

// Re-export commonly used schema tables for easier access
const { users, events, venues, blogPosts, artists, categories, favorites, messages, recommendations } = schema;

const config: StorageConfig = { db };

// Definir tipos para las relaciones
type UserWithRelations = typeof users.$inferSelect;
type CategoryWithRelations = typeof categories.$inferSelect;
type ArtistWithRelations = typeof artists.$inferSelect & {
  user: UserWithRelations;
  category?: CategoryWithRelations;
};

type FavoriteWithUser = typeof favorites.$inferSelect & {
  user: UserWithRelations;
};

type SocialMedia = {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
};

type FavoriteItem = {
  type: 'artist' | 'event' | 'venue' | 'gallery';
  id: number;
  userId: string;
  targetId: number;
  targetType: string;
  createdAt: Date;
  updatedAt: Date;
  user: UserWithRelations;
};

// Definir el tipo para el propietario del venue
type VenueOwner = NonNullable<typeof users.$inferSelect>;

// Definir el tipo para el venue con su propietario
type VenueWithCompany = typeof venues.$inferSelect & {
  owner: VenueOwner;
};

export class DatabaseStorage implements IStorage {
  private static instance: DatabaseStorage | null = null;
  private config: StorageConfig;
  public readonly db: PostgresJsDatabase<Record<string, unknown>>;
  
  // Storage implementations
  public eventStorage: EventStorage;
  public userStorage: UserStorage;
  public venueStorage: VenueStorage;
  public artistStorage: ArtistStorage;
  public messageStorage: MessageStorage;
  public recommendationStorage: RecommendationStorage;
  public favoriteStorage: FavoriteStorage;
  public blogStorage: BlogStorage;
  public categoryStorage: CategoryStorage;
  public reviews: ReviewStorage;
  public hiring: HiringStorage;

  private constructor(config: StorageConfig) {
    this.config = config;
    this.db = config.db;
    
    // Initialize storage implementations
    this.eventStorage = new EventStorage(this.db);
    this.userStorage = new UserStorage(this.db);
    this.venueStorage = new VenueStorage(this.db);
    this.artistStorage = new ArtistStorage(this.db);
    this.messageStorage = new MessageStorage(this.db);
    this.recommendationStorage = new RecommendationStorage(this.db);
    this.favoriteStorage = new FavoriteStorage(this.db);
    this.blogStorage = new BlogStorage(this.db);
    this.categoryStorage = new CategoryStorage(this.db);
    this.reviews = new ReviewStorage(this.db);
    this.hiring = new HiringStorage(this.db);
  }

  public static getInstance(config: StorageConfig): DatabaseStorage {
    if (!DatabaseStorage.instance) {
      DatabaseStorage.instance = new DatabaseStorage(config);
    }
    return DatabaseStorage.instance;
  }

  // Category methods
  async getCategories(): Promise<CategoryWithRelations[]> {
    return this.categoryStorage.getCategories();
  }

  async createCategory(category: Omit<typeof categories.$inferInsert, 'id'>): Promise<CategoryWithRelations> {
    return this.categoryStorage.createCategory(category);
  }

  // User methods
  async getUser(id: string): Promise<UserWithRelations | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUsers(filters: { userType?: 'general' | 'artist' | 'company' } = {}): Promise<UserWithRelations[]> {
    return this.userStorage.getUsers(filters);
  }

  async upsertUser(
    user: { id: string } & Partial<{
      email: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      userType: 'general' | 'artist' | 'company';
      bio: string | null;
      city: string | null;
      isVerified: boolean;
    }>
  ): Promise<UserWithRelations> {
    // Crear el objeto con valores por defecto
    const now = new Date();
    const userData = {
      id: user.id,
      email: user.email || '',
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      userType: user.userType ?? 'general',
      bio: user.bio ?? null,
      city: user.city ?? null,
      isVerified: user.isVerified ?? false,
      createdAt: now,
      updatedAt: now
    };

    // Usar sql.raw para manejar los valores nulos correctamente
    const [result] = await this.db
      .insert(users)
      .values({
        ...userData,
        firstName: userData.firstName === null ? sql`NULL` : userData.firstName,
        lastName: userData.lastName === null ? sql`NULL` : userData.lastName,
        bio: userData.bio === null ? sql`NULL` : userData.bio,
        city: userData.city === null ? sql`NULL` : userData.city,
        profileImageUrl: userData.profileImageUrl === null ? sql`NULL` : userData.profileImageUrl
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          // Nota: solo actualizamos email si viene en la petición; de lo contrario se mantiene.
          ...(typeof (user as any).email !== 'undefined' ? { email: userData.email } : {}),
          firstName: userData.firstName === null ? sql`NULL` : userData.firstName,
          lastName: userData.lastName === null ? sql`NULL` : userData.lastName,
          profileImageUrl: userData.profileImageUrl === null ? sql`NULL` : userData.profileImageUrl,
          userType: userData.userType,
          bio: userData.bio === null ? sql`NULL` : userData.bio,
          city: userData.city === null ? sql`NULL` : userData.city,
          isVerified: userData.isVerified,
          updatedAt: now
        }
      })
      .returning();
    
    return result as UserWithRelations;
  }

  // Artist methods
  async getArtist(id: number): Promise<ArtistWithRelations | undefined> {
    try {
      const result = await this.db
        .select()
        .from(artists)
        .leftJoin(users, eq(artists.userId, users.id))
        .leftJoin(categories, eq(artists.categoryId, categories.id))
        .where(eq(artists.id, id))
        .limit(1);

      if (result.length === 0) {
        return undefined;
      }

      const artistData = result[0];
      const artist = artistData.artists;
      const user = artistData.users;
      const category = artistData.categories;
      
      if (!user) {
        throw new Error('User not found for artist');
      }

      return {
        ...artist,
        user,
        category: category || undefined
      };
    } catch (error) {
      console.error('Error fetching artist:', error);
      throw new Error('Failed to fetch artist');
    }
  }

  async getArtists(filters: { categoryId?: number; userId?: string } = {}): Promise<ArtistWithRelations[]> {
    try {
      const { categoryId, userId } = filters;
      
      // Build the base query with necessary joins
      const query = this.db
        .select()
        .from(artists)
        .leftJoin(users, eq(artists.userId, users.id))
        .leftJoin(categories, eq(artists.categoryId, categories.id));

      // Apply filters if present
      const conditions: SQL[] = [];
      
      if (categoryId) {
        conditions.push(eq(artists.categoryId, categoryId));
      }
      
      if (userId) {
        conditions.push(eq(artists.userId, userId));
      }
      
      // Apply conditions with AND if any
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      // Execute the query
      const results = await query;
      
      // Transform and return the results (omit orphan rows without user)
      return results
        .filter(row => !!row.users)
        .map(row => ({
          ...row.artists,
          user: row.users!,
          category: row.categories || undefined
        }));
    } catch (error) {
      console.error('Error fetching artists:', error);
      throw new Error('Failed to fetch artists');
    }
  }

  async createArtist(artistData: Omit<typeof artists.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof artists.$inferSelect> {
    try {
      const [newArtist] = await this.db
        .insert(artists)
        .values({
          ...artistData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      if (!newArtist) {
        throw new Error('Failed to create artist');
      }

      return newArtist;
    } catch (error) {
      console.error('Error creating artist:', error);
      throw new Error('Failed to create artist');
    }
  }

  async updateArtist(
    id: number,
    artistData: Partial<typeof artists.$inferInsert>
  ): Promise<typeof artists.$inferSelect> {
    try {
      const [updatedArtist] = await this.db
        .update(artists)
        .set({
          ...artistData,
          updatedAt: new Date()
        })
        .where(eq(artists.id, id))
        .returning();

      if (!updatedArtist) {
        throw new Error(`Artist with ID ${id} not found`);
      }

      return updatedArtist;
    } catch (error) {
      console.error(`Error updating artist ${id}:`, error);
      throw new Error('Failed to update artist');
    }
  }

  // Message methods
  async getMessage(id: number) {
    return this.messageStorage.getMessage(id);
  }

  async getMessages(filters: { senderId?: string; receiverId?: string } = {}) {
    return this.messageStorage.getMessages(filters);
  }

  async sendMessage(message: Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.messageStorage.sendMessage(message);
  }

  async getUserMessages(userId: string) {
    return this.messageStorage.getUserMessages(userId);
  }

  async getConversation(userId1: string, userId2: string) {
    return this.messageStorage.getConversation(userId1, userId2);
  }

  // Recommendation methods
  async getRecommendations(filters: { categoryId?: number, city?: string, isActive?: boolean, search?: string } = {}) {
    return this.recommendationStorage.getRecommendations(filters);
  }

  async createRecommendation(recommendation: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.recommendationStorage.createRecommendation(recommendation);
  }

  // Favorite methods
  async getFavorites(filters: { userId: string }) {
    return this.favoriteStorage.getFavorites(filters);
  }

  async getUserFavorites(userId: string, targetType?: 'artist' | 'gallery' | 'event' | 'venue') {
    return this.favoriteStorage.getUserFavorites(userId, targetType);
  }

  async addFavorite(favorite: Omit<typeof favorites.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.favoriteStorage.addFavorite(favorite);
  }

  async removeFavorite(userId: string, targetId: number, targetType: 'artist' | 'gallery' | 'event' | 'venue') {
    return this.favoriteStorage.removeFavorite(userId, targetId, targetType);
  }

  // Blog methods
  async getBlogPost(id: number) {
    return this.blogStorage.getBlogPost(id);
  }

  async getBlogPosts(filters: { authorId?: string, category?: string, visibility?: 'draft' | 'public' | 'private', search?: string } = {}) {
    return this.blogStorage.getBlogPosts(filters);
  }

  async createBlogPost(post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.blogStorage.createBlogPost(post);
  }

  async updateBlogPost(id: number, post: Partial<typeof blogPosts.$inferInsert>) {
    return this.blogStorage.updateBlogPost(id, post);
  }

  async deleteBlogPost(id: number) {
    return this.blogStorage.deleteBlogPost(id);
  }

  // Event methods
  async getEvent(id: number) {
    return this.eventStorage.getEvent(id);
  }

  async getEvents(filters: { categoryId?: number; organizerId?: string } = {}) {
    return this.eventStorage.getEvents(filters);
  }

  async createEvent(event: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.eventStorage.createEvent(event);
  }

  async updateEvent(id: number, event: Partial<typeof events.$inferInsert>) {
    return this.eventStorage.updateEvent(id, event);
  }

  async deleteEvent(id: number) {
    return this.eventStorage.deleteEvent(id);
  }

  // Venue methods
  async getVenue(id: number): Promise<VenueWithCompany | undefined> {
    const companyAlias = alias(users, 'company');
    
    const results = await this.db
      .select()
      .from(venues)
      .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id))
      .where(eq(venues.id, id));

    const result = results[0];
    if (!result || !result.company) return undefined;

    return {
      ...result.venues,
      owner: result.company
    } as VenueWithCompany;
  }

  async getVenues(filters: { ownerId?: string } = {}): Promise<VenueWithCompany[]> {
    const companyAlias = alias(users, 'company');
    
    // Construir la consulta base
    const query = this.db
      .select()
      .from(venues)
      .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id));

    // Aplicar filtros condicionalmente
    const filteredQuery = filters.ownerId 
      ? query.where(eq(companyAlias.id, filters.ownerId))
      : query;

    const results = await filteredQuery;
    
    // Mapear los resultados al formato esperado
    return results.map(row => ({
      ...row.venues,
      owner: row.company!
    }));
  }

  async createVenue(venue: Omit<typeof venues.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.venueStorage.createVenue(venue);
  }

  async updateVenue(id: number, venue: Partial<typeof venues.$inferInsert>) {
    return this.venueStorage.updateVenue(id, venue);
  }

  async deleteVenue(id: number) {
    return this.venueStorage.deleteVenue(id);
  }

  // Artist deletion
  async deleteArtist(id: number): Promise<void> {
    try {
      await this.db.delete(artists).where(eq(artists.id, id));
    } catch (error) {
      console.error(`Error deleting artist ${id}:`, error);
      throw new Error('Failed to delete artist');
    }
  }
}

// Export a singleton instance of the storage
export const storage = DatabaseStorage.getInstance({ db });
