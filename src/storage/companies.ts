import { db } from '../db.js';
import { companies, users, venues } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Definir tipos para los resultados de las consultas
type UserType = typeof users.$inferSelect;
type CompanyType = typeof companies.$inferSelect;
type VenueType = typeof venues.$inferSelect;

type CompanyWithRelations = {
  company: CompanyType;
  user: UserType;
  venues?: VenueType[];
};

export class CompanyStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  /**
   * Obtener una empresa por ID con sus relaciones
   */
  async getCompany(id: number): Promise<CompanyWithRelations | undefined> {
    const userAlias = alias(users, 'user');

    const [result] = await this.db
      .select({
        company: companies,
        user: userAlias,
      })
      .from(companies)
      .where(eq(companies.id, id))
      .leftJoin(userAlias, eq(companies.userId, userAlias.id));

    if (!result || !result.user) return undefined;

    // Obtener venues asociados
    const companyVenues = await this.db
      .select()
      .from(venues)
      .where(eq(venues.companyId, id));

    return {
      company: result.company,
      user: result.user,
      venues: companyVenues,
    };
  }

  /**
   * Obtener empresas por userId
   */
  async getCompaniesByUserId(userId: string): Promise<CompanyType[]> {
    return await this.db
      .select()
      .from(companies)
      .where(eq(companies.userId, userId))
      .orderBy(companies.createdAt);
  }

  /**
   * Obtener todas las empresas con filtros
   */
  async getCompanies(params?: {
    limit?: number;
    offset?: number;
    companyType?: string;
    city?: string;
    isActive?: boolean;
  }): Promise<CompanyWithRelations[]> {
    const userAlias = alias(users, 'user');

    // Construir la consulta base con los joins
    const query = this.db
      .select({
        company: companies,
        user: userAlias,
      })
      .from(companies)
      .leftJoin(userAlias, eq(companies.userId, userAlias.id));

    // Aplicar condiciones de filtrado
    const conditions = [];

    if (params?.companyType) {
      conditions.push(eq(companies.companyType, params.companyType as any));
    }

    if (params?.city) {
      conditions.push(eq(companies.city, params.city));
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(companies.isActive, params.isActive));
    }

    // Aplicar condiciones si existen
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Ejecutar la consulta con las condiciones
    const results = whereClause ? await query.where(whereClause) : await query;

    // Aplicar paginación
    const paginatedResults = params?.limit
      ? results.slice(params.offset || 0, (params.offset || 0) + params.limit)
      : results;

    // Filtrar resultados nulos y mapear a la estructura esperada
    return paginatedResults
      .filter(
        (
          result
        ): result is {
          company: CompanyType;
          user: UserType;
        } => {
          return result.user !== null;
        }
      )
      .map((result) => ({
        company: result.company,
        user: result.user,
      }));
  }

  /**
   * Obtener empresa principal del usuario
   */
  async getPrimaryCompany(userId: string): Promise<CompanyType | undefined> {
    const [company] = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.isPrimary, true)))
      .limit(1);

    return company;
  }

  /**
   * Crear una nueva empresa
   */
  async createCompany(data: {
    userId: string;
    companyName: string;
    legalName?: string | null;
    taxId?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    companyType?: string | null;
    categories?: string[];
    subcategories?: string[];
    tags?: string[];
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    socialMedia?: Record<string, unknown>;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    coordinates?: Record<string, unknown> | null;
    services?: unknown[];
    amenities?: unknown[];
    capacity?: number | null;
    rooms?: unknown[];
    openingHours?: Record<string, unknown>;
    is24h?: boolean;
    priceRange?: Record<string, unknown> | null;
    depositRequired?: boolean;
    depositAmount?: string | null;
    logoUrl?: string | null;
    coverPhotoUrl?: string | null;
    gallery?: unknown[];
    videoTourUrl?: string | null;
    isPrimary?: boolean;
    portfolio?: unknown[];
    bio?: string | null;
    history?: unknown[];
    mission?: string | null;
    vision?: string | null;
    team?: unknown[];
    teamSize?: number | null;
    foundedYear?: number | null;
    certifications?: unknown[];
    awards?: unknown[];
    licenses?: unknown[];
    partnerships?: unknown[];
    linkedAccounts?: Record<string, unknown>;
    languages?: unknown[];
    education?: unknown[];
    workExperience?: unknown[];
  }) {
    const [company] = await this.db
      .insert(companies)
      .values({
        userId: data.userId,
        companyName: data.companyName,
        legalName: data.legalName,
        taxId: data.taxId,
        description: data.description,
        shortDescription: data.shortDescription,
        companyType: data.companyType as any,
        categories: data.categories ?? [],
        subcategories: data.subcategories ?? [],
        tags: data.tags ?? [],
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        website: data.website,
        socialMedia: data.socialMedia ?? {},
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        coordinates: data.coordinates,
        services: data.services ?? [],
        amenities: data.amenities ?? [],
        capacity: data.capacity,
        rooms: data.rooms ?? [],
        openingHours: data.openingHours ?? {},
        is24h: data.is24h ?? false,
        priceRange: data.priceRange,
        depositRequired: data.depositRequired ?? false,
        depositAmount: data.depositAmount,
        logoUrl: data.logoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        gallery: data.gallery ?? [],
        videoTourUrl: data.videoTourUrl,
        isPrimary: data.isPrimary ?? false,
        portfolio: data.portfolio ?? [],
        bio: data.bio,
        history: data.history ?? [],
        mission: data.mission,
        vision: data.vision,
        team: data.team ?? [],
        teamSize: data.teamSize,
        foundedYear: data.foundedYear,
        certifications: data.certifications ?? [],
        awards: data.awards ?? [],
        licenses: data.licenses ?? [],
        partnerships: data.partnerships ?? [],
        linkedAccounts: data.linkedAccounts ?? {},
        languages: data.languages ?? [],
        education: data.education ?? [],
        workExperience: data.workExperience ?? [],
        isActive: true,
        isVerified: false,
        isProfileComplete: false,
        rating: '0',
        totalReviews: 0,
        viewCount: 0,
        saveCount: 0,
        fanCount: 0,
        metadata: {},
      } as any)
      .returning();

    return company;
  }

  /**
   * Actualizar una empresa existente
   */
  async updateCompany(
    id: number,
    data: {
      companyName?: string;
      legalName?: string | null;
      taxId?: string | null;
      description?: string | null;
      shortDescription?: string | null;
      companyType?: string | null;
      categories?: string[];
      subcategories?: string[];
      tags?: string[];
      contactPerson?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      socialMedia?: Record<string, unknown>;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postalCode?: string | null;
      coordinates?: Record<string, unknown> | null;
      services?: unknown[];
      amenities?: unknown[];
      capacity?: number | null;
      rooms?: unknown[];
      openingHours?: Record<string, unknown>;
      is24h?: boolean;
      priceRange?: Record<string, unknown> | null;
      depositRequired?: boolean;
      depositAmount?: string | null;
      logoUrl?: string | null;
      coverPhotoUrl?: string | null;
      gallery?: unknown[];
      videoTourUrl?: string | null;
      isPrimary?: boolean;
      isActive?: boolean;
      isVerified?: boolean;
      isProfileComplete?: boolean;
      portfolio?: unknown[];
      bio?: string | null;
      history?: unknown[];
      mission?: string | null;
      vision?: string | null;
      team?: unknown[];
      teamSize?: number | null;
      foundedYear?: number | null;
      certifications?: unknown[];
      awards?: unknown[];
      licenses?: unknown[];
      partnerships?: unknown[];
      linkedAccounts?: Record<string, unknown>;
      languages?: unknown[];
      education?: unknown[];
      workExperience?: unknown[];
    }
  ) {
    const [company] = await this.db
      .update(companies)
      .set({
        ...data,
        companyType: data.companyType as any,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    return company;
  }

  /**
   * Eliminar una empresa
   */
  async deleteCompany(id: number) {
    await this.db.delete(companies).where(eq(companies.id, id));
  }

  /**
   * Establecer una empresa como principal
   */
  async setPrimaryCompany(userId: string, companyId: number) {
    // Desmarcar todas las empresas del usuario como principales
    await this.db
      .update(companies)
      .set({ isPrimary: false })
      .where(eq(companies.userId, userId));

    // Marcar la empresa seleccionada como principal
    const [company] = await this.db
      .update(companies)
      .set({ isPrimary: true })
      .where(eq(companies.id, companyId))
      .returning();

    return company;
  }

  /**
   * Obtener información pública de la empresa (sin datos sensibles)
   */
  async getPublicCompanyProfile(id: number) {
    const result = await this.getCompany(id);
    if (!result) return undefined;

    // Remover información sensible
    const { taxId, email, phone, ...publicCompany } = result.company;

    return {
      ...result,
      company: publicCompany,
    };
  }

  /**
   * Verificar si el usuario es dueño de la empresa
   */
  async isCompanyOwner(companyId: number, userId: string): Promise<boolean> {
    const [company] = await this.db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.userId, userId)))
      .limit(1);

    return !!company;
  }

  /**
   * Incrementar contador de vistas
   */
  async incrementViewCount(id: number) {
    await this.db
      .update(companies)
      .set({ viewCount: sql`${companies.viewCount} + 1` })
      .where(eq(companies.id, id));
  }

  /**
   * Incrementar contador de favoritos
   */
  async incrementSaveCount(id: number) {
    await this.db
      .update(companies)
      .set({
        saveCount: sql`${companies.saveCount} + 1`,
        fanCount: sql`${companies.fanCount} + 1`
      })
      .where(eq(companies.id, id));
  }

  /**
   * Decrementar contador de favoritos
   */
  async decrementSaveCount(id: number) {
    await this.db
      .update(companies)
      .set({
        saveCount: sql`${companies.saveCount} - 1`,
        fanCount: sql`${companies.fanCount} - 1`
      })
      .where(eq(companies.id, id));
  }
}

export const companyStorage = new CompanyStorage(db);
