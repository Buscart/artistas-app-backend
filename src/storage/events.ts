import { db } from '../db.js';
import { events, users, categories } from '../schema.js';
import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { InferSelectModel } from 'drizzle-orm';

// Define the base event type from the schema
type Event = InferSelectModel<typeof events>;
type User = InferSelectModel<typeof users>;
type Category = InferSelectModel<typeof categories>;

// Define the event with relations type matching index.ts expectations
type EventWithRelations = Event & {
  organizer: User;
  category?: Category;
};

// Type for the joined query result
type EventJoinResult = Event & {
  organizer: User;
  category: Category | null;
};

export class EventStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  async getEvent(id: number): Promise<EventWithRelations | undefined> {
    const organizerAlias = alias(users, 'organizer');
    const categoryAlias = alias(categories, 'category');

    const result = await this.db
      .select({
        // Seleccionar todos los campos de events
        ...Object.fromEntries(
          Object.entries(events).map(([key, value]) => [key, events[key as keyof typeof events]])
        ),
        organizer: organizerAlias,
        category: categoryAlias
      })
      .from(events)
      .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
      .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id))
      .where(and(
        eq(events.id, id),
        isNotNull(organizerAlias.id)
      ))
      .limit(1);

    if (result.length === 0) return undefined;
    
    const row = result[0];
    if (!row.organizer) return undefined;

    // Extraer los campos del evento (todos excepto organizer y category)
    const { organizer, category, ...eventData } = row;
    
    return {
      ...eventData,
      organizer,
      category: category || undefined
    } as unknown as EventWithRelations;
  }

  async getEvents(filters: { 
    organizerId?: string; 
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<EventWithRelations[]> {
    const organizerAlias = alias(users, 'organizer');
    const categoryAlias = alias(categories, 'category');

    const conditions = [isNotNull(organizerAlias.id)];
    
    if (filters.organizerId) {
      conditions.push(eq(events.organizerId, filters.organizerId));
    }
    
    if (filters.categoryId) {
      conditions.push(eq(events.categoryId, filters.categoryId));
    }
    
    if (filters.startDate) {
      conditions.push(sql`${events.startDate} >= ${filters.startDate}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`${events.endDate} <= ${filters.endDate}`);
    }
    
    const results = await this.db
      .select({
        event: events,
        organizer: organizerAlias,
        category: categoryAlias
      })
      .from(events)
      .leftJoin(organizerAlias, eq(events.organizerId, organizerAlias.id))
      .leftJoin(categoryAlias, eq(events.categoryId, categoryAlias.id))
      .where(and(...conditions));

    // Map the results to the expected format
    return results
      .filter((row): row is { event: Event; organizer: User; category: Category | null } => !!row.organizer)
      .map(({ event, organizer, category }) => ({
        ...event,
        organizer,
        category: category || undefined
      }));
  }

  async createEvent(data: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const description = data.description || '';
    const shortDescription = description.length > 300 
      ? `${description.substring(0, 297)}...` 
      : description;

    // Extract the event data, handling any special fields
    const eventData: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      shortDescription,
      slug: data.slug || String(data.title).toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, ''),
      status: 'published' as const,
      // Handle optional fields with proper typing
      ...('imageUrl' in data && { featuredImage: (data as any).imageUrl }),
      ...('isPublic' in data && { isPublic: (data as any).isPublic }),
      ...(data.capacity !== undefined && { availableTickets: data.capacity })
    };

    const [event] = await this.db
      .insert(events)
      .values({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
      
    return event;
  }

  async updateEvent(
    id: number,
    data: Partial<Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Event> {
    const updateData: Partial<typeof events.$inferInsert> = { ...data };
    
    // Handle special fields if they exist
    if ('description' in updateData && updateData.description !== undefined) {
      const description = updateData.description || '';
      updateData.shortDescription = description.length > 300 
        ? `${description.substring(0, 297)}...`
        : description;
    }

    // Handle image URL if provided
    if ('imageUrl' in updateData) {
      updateData.featuredImage = (updateData as any).imageUrl || null;
      delete (updateData as any).imageUrl;
    }

    // Ensure we don't try to update the ID or timestamps
    delete (updateData as any).id;
    delete (updateData as any).createdAt;
    
    updateData.updatedAt = new Date();
    
    const [event] = await this.db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.db.delete(events).where(eq(events.id, id));
  }
}

export const eventStorage = new EventStorage(db);
