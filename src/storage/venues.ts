import type { Database } from '../types/db.js';
import { venues, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

type VenueWithCompany = typeof venues.$inferSelect & {
  company: typeof users.$inferSelect;
};

export class VenueStorage {
  constructor(private db: Database) {}

  async getVenue(id: number): Promise<VenueWithCompany | undefined> {
    const companyAlias = alias(users, 'company');
    
    const results = await this.db
      .select()
      .from(venues)
      .leftJoin(companyAlias, eq(venues.companyId, companyAlias.id))
      .where(eq(venues.id, id));

    const result = results[0];
    if (!result) return undefined;

    // Create a proper company object with all required fields
    const company = result.company || {
      id: '',
      email: '',
      password: null,
      firstName: '',
      lastName: null,
      displayName: null,
      profileImageUrl: null,
      coverImageUrl: null,
      userType: 'company',
      bio: null,
      city: null,
      address: null,
      phone: null,
      website: null,
      socialMedia: null,
      isVerified: false,
      isFeatured: false,
      isAvailable: true,
      rating: '0',
      totalReviews: 0,
      fanCount: 0,
      preferences: {},
      settings: {},
      lastActive: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      ...result.venues,
      company
    } as any;
  }

  async getVenues(filters: { companyId?: number } = {}): Promise<VenueWithCompany[]> {
    const companyAlias = alias(users, 'company');
    
    const query = this.db
      .select()
      .from(venues)
      .leftJoin(companyAlias, eq(venues.companyId, companyAlias.id));

    if (filters.companyId !== undefined) {
      query.where(eq(venues.companyId, filters.companyId));
    }

    const results = await query;
    
    return results.map(result => {
      // Create a proper company object with all required fields
      const company = result.company || {
        id: '',
        email: '',
        password: null,
        firstName: '',
        lastName: null,
        displayName: null,
        profileImageUrl: null,
        coverImageUrl: null,
        userType: 'company',
        bio: null,
        city: null,
        address: null,
        phone: null,
        website: null,
        socialMedia: null,
        isVerified: false,
        isFeatured: false,
        isAvailable: true,
        rating: '0',
        totalReviews: 0,
        fanCount: 0,
        preferences: {},
        settings: {},
        lastActive: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        ...result.venues,
        company
      };
    }) as any;
  }

  async createVenue(data: typeof venues.$inferInsert): Promise<typeof venues.$inferSelect> {
    const [result] = await this.db.insert(venues).values(data).returning();
    return result;
  }

  async updateVenue(id: number, data: Partial<typeof venues.$inferInsert>): Promise<typeof venues.$inferSelect> {
    const [result] = await this.db
      .update(venues)
      .set(data)
      .where(eq(venues.id, id))
      .returning();
    return result;
  }

  async deleteVenue(id: number): Promise<void> {
    await this.db.delete(venues).where(eq(venues.id, id));
  }
}