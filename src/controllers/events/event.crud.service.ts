import { and, eq, gte, lte, ne, or, sql, SQL, count, desc } from 'drizzle-orm';
import { events, categories, users, eventAttendees, eventReviews, eventAgenda } from '../../schema.js';
import { db } from '../../db.js';
import { generateUniqueSlug } from './event.utils.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cache.service.js';

export class EventCrudService {
  static async getEventById(eventId: number, userId?: string) {
    const [result] = await db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        shortDescription: events.shortDescription,
        startDate: events.startDate,
        endDate: events.endDate,
        timezone: events.timezone,
        locationType: events.locationType,
        address: events.address,
        city: events.city,
        state: events.state,
        country: events.country,
        coordinates: events.coordinates,
        onlineEventUrl: events.onlineEventUrl,
        venueName: events.venueName,
        venueDescription: events.venueDescription,
        isFree: events.isFree,
        ticketPrice: events.ticketPrice,
        ticketUrl: events.ticketUrl,
        capacity: events.capacity,
        availableTickets: events.availableTickets,
        featuredImage: events.featuredImage,
        gallery: events.gallery,
        videoUrl: events.videoUrl,
        status: events.status,
        isFeatured: events.isFeatured,
        isRecurring: events.isRecurring,
        recurrencePattern: events.recurrencePattern,
        categoryId: events.categoryId,
        subcategories: events.subcategories,
        tags: events.tags,
        eventType: events.eventType,
        organizerId: events.organizerId,
        companyId: events.companyId,
        viewCount: events.viewCount,
        saveCount: events.saveCount,
        shareCount: events.shareCount,
        requiresApproval: events.requiresApproval,
        enableWaitlist: events.enableWaitlist,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          isVerified: users.isVerified,
          userType: users.userType,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.id, eventId));

    if (!result) return null;

    await db
      .update(events)
      .set({ viewCount: (result.viewCount || 0) + 1 })
      .where(eq(events.id, eventId));

    const agenda = await db
      .select({
        id: eventAgenda.id,
        title: eventAgenda.title,
        description: eventAgenda.description,
        startTime: eventAgenda.startTime,
        endTime: eventAgenda.endTime,
        location: eventAgenda.location,
        speakerName: eventAgenda.speakerName,
        speakerTitle: eventAgenda.speakerTitle,
        speakerImage: eventAgenda.speakerImage,
        sortOrder: eventAgenda.sortOrder,
      })
      .from(eventAgenda)
      .where(eq(eventAgenda.eventId, eventId))
      .orderBy(eventAgenda.sortOrder);

    const reviews = await db
      .select({
        id: eventReviews.id,
        rating: eventReviews.rating,
        title: eventReviews.title,
        comment: eventReviews.comment,
        isVerified: eventReviews.isVerified,
        createdAt: eventReviews.createdAt,
        organizerResponse: eventReviews.organizerResponse,
        organizerResponseAt: eventReviews.organizerResponseAt,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventReviews)
      .leftJoin(users, eq(eventReviews.userId, users.id))
      .where(and(eq(eventReviews.eventId, eventId), eq(eventReviews.isHidden, false)))
      .orderBy(desc(eventReviews.createdAt));

    const reviewStats = {
      count: reviews.length,
      average: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      }
    };

    let userRegistration = null;
    if (userId) {
      const [registration] = await db
        .select({
          id: eventAttendees.id,
          status: eventAttendees.status,
          registeredAt: eventAttendees.registeredAt,
          checkedInAt: eventAttendees.checkedInAt,
          certificateUrl: eventAttendees.certificateUrl,
        })
        .from(eventAttendees)
        .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));

      if (registration) {
        const [existingReview] = await db
          .select({ id: eventReviews.id })
          .from(eventReviews)
          .where(and(eq(eventReviews.eventId, eventId), eq(eventReviews.userId, userId)));

        const eventDate = result.startDate ? new Date(result.startDate) : new Date();
        const isEventPast = eventDate < new Date() || result.status === 'completed';

        userRegistration = {
          ...registration,
          isRegistered: true,
          hasReviewed: !!existingReview,
          canReview: registration.status === 'approved' && !!registration.checkedInAt && isEventPast && !existingReview,
          canDownloadCertificate: registration.status === 'approved' && !!registration.checkedInAt,
        };
      }
    }

    const [attendeeCount] = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.status, 'approved')));

    return { ...result, agenda, reviews, reviewStats, userRegistration, attendeeCount: attendeeCount?.count || 0 };
  }

  static async createEvent(eventData: CreateEventInput, userId: string) {
    const slug = await generateUniqueSlug(eventData.title);
    const startDate = eventData.startDate ? new Date(eventData.startDate) : new Date();
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    const newEvent = {
      title: eventData.title,
      description: eventData.description,
      shortDescription: (eventData as any).bio || eventData.shortDescription || null,
      startDate,
      endDate: endDate || null,
      timezone: eventData.timezone || 'America/Mexico_City',
      locationType: eventData.locationType,
      address: eventData.address || null,
      city: eventData.city || null,
      state: eventData.state || null,
      country: eventData.country || null,
      coordinates: eventData.coordinates || null,
      onlineEventUrl: eventData.onlineEventUrl || null,
      venueName: eventData.venueName || null,
      venueDescription: eventData.venueDescription || null,
      isFree: eventData.isFree || false,
      ticketPrice: eventData.ticketPrice ? sql`${eventData.ticketPrice}::numeric` : null,
      ticketUrl: eventData.ticketUrl || null,
      capacity: eventData.capacity || null,
      availableTickets: eventData.availableTickets || null,
      featuredImage: eventData.featuredImage || null,
      gallery: eventData.gallery || [],
      videoUrl: eventData.videoUrl || null,
      status: 'draft' as const,
      isFeatured: false,
      isRecurring: eventData.isRecurring || false,
      recurrencePattern: eventData.recurrencePattern || null,
      categoryId: eventData.categoryId || null,
      subcategories: eventData.subcategories || [],
      tags: eventData.tags || [],
      eventType: eventData.eventType || 'other',
      slug,
      organizerId: userId,
      companyId: eventData.companyId ? parseInt(eventData.companyId) : null,
      viewCount: 0,
      saveCount: 0,
      shareCount: 0,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    };

    const [newEventRecord] = await db.insert(events).values(newEvent).returning();

    cacheService.invalidateUserEvents(userId);
    cacheService.del(CacheKeys.EVENTS_UPCOMING);
    cacheService.del(CacheKeys.EVENTS_PUBLIC);

    return newEventRecord;
  }

  static async getCompanyEvents(companyId: number) {
    return db
      .select()
      .from(events)
      .where(eq(events.companyId, companyId))
      .orderBy(sql`${events.startDate} DESC`);
  }

  static async getMyEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_BY_USER(userId);
    return cacheService.getOrSet(cacheKey, async () => {
      return db
        .select()
        .from(events)
        .where(eq(events.organizerId, userId))
        .orderBy(sql`${events.startDate} DESC`);
    }, CacheTTL.MEDIUM);
  }

  static async updateEvent(eventId: number, eventData: UpdateEventInput, userId: string) {
    const [existingEvent] = await db.select().from(events).where(eq(events.id, eventId));

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND');
    if (existingEvent.organizerId !== userId) throw new Error('FORBIDDEN');

    const updateData: any = { ...eventData };

    if (updateData.bio !== undefined) {
      updateData.shortDescription = updateData.bio;
      delete updateData.bio;
    }

    if (updateData.title && updateData.title !== existingEvent.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, eventId);
    }

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    else if (updateData.endDate === null) updateData.endDate = null;

    updateData.updatedAt = new Date();
    delete updateData.id;
    delete updateData.organizerId;
    delete updateData.createdAt;

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return updatedEvent;
  }

  static async cancelEvent(eventId: number, userId: string) {
    const [existingEvent] = await db.select().from(events).where(eq(events.id, eventId));

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND');
    if (existingEvent.organizerId !== userId) throw new Error('FORBIDDEN');
    if (existingEvent.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

    const [cancelledEvent] = await db
      .update(events)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning();

    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return cancelledEvent;
  }

  static async deleteEvent(eventId: number, userId: string) {
    const [existingEvent] = await db.select().from(events).where(eq(events.id, eventId));

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND');
    if (existingEvent.organizerId !== userId) throw new Error('FORBIDDEN');

    const [attendeeCount] = await db
      .select({ count: count() })
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        or(
          eq(eventAttendees.status, 'approved'),
          eq(eventAttendees.status, 'checked_in'),
          sql`${eventAttendees.checkedInAt} IS NOT NULL`
        )
      ));

    if (attendeeCount && Number(attendeeCount.count) > 0) throw new Error('HAS_ATTENDEES');

    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, eventId));
    await db.delete(eventReviews).where(eq(eventReviews.eventId, eventId));
    await db.delete(eventAgenda).where(eq(eventAgenda.eventId, eventId));

    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning();

    cacheService.invalidateEvent(eventId);
    cacheService.invalidateUserEvents(userId);

    return deletedEvent;
  }

  static async isEventOrganizer(eventId: number, userId?: string): Promise<boolean> {
    if (!userId) return false;
    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId));
    return event?.organizerId === userId;
  }

  static async searchEvents(filters: EventFilterOptions) {
    const { query, category, startDate, endDate, isFree, location, eventType, limit = '20', offset = '0' } = filters;

    const conditions: SQL[] = [eq(events.status, 'published'), ne(events.status, 'cancelled')];

    if (query && typeof query === 'string') {
      const searchTerm = `%${query}%`;
      const searchCondition = or(
        sql`LOWER(${events.title}::text) LIKE LOWER(${searchTerm}::text)`,
        sql`LOWER(${events.description}::text) LIKE LOWER(${searchTerm}::text)`,
        sql`LOWER(${events.shortDescription}::text) LIKE LOWER(${searchTerm}::text)`
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    if (category) conditions.push(eq(categories.name, category));
    if (startDate) conditions.push(gte(events.startDate, new Date(startDate)));
    if (endDate) conditions.push(lte(events.endDate || events.startDate, new Date(endDate)));

    if (eventType && typeof eventType === 'string') {
      const validEventTypes = ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other'];
      if (validEventTypes.includes(eventType)) {
        conditions.push(eq(events.eventType, eventType as any));
      }
    }

    if (location && typeof location === 'string') {
      const locationTerm = `%${location}%`;
      const locationCondition = or(
        sql`LOWER(${events.city}::text) LIKE LOWER(${locationTerm}::text)`,
        sql`LOWER(${events.state}::text) LIKE LOWER(${locationTerm}::text)`,
        sql`LOWER(${events.country}::text) LIKE LOWER(${locationTerm}::text)`,
        sql`LOWER(${events.venueName}::text) LIKE LOWER(${locationTerm}::text)`
      );
      if (locationCondition) conditions.push(locationCondition);
    }

    if (isFree !== undefined) {
      const isFreeBool = typeof isFree === 'string' ? isFree === 'true' : Boolean(isFree);
      conditions.push(eq(events.isFree, isFreeBool));
    }

    const [eventsList, totalCount] = await Promise.all([
      db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        shortDescription: events.shortDescription,
        startDate: events.startDate,
        endDate: events.endDate,
        timezone: events.timezone,
        locationType: events.locationType,
        address: events.address,
        city: events.city,
        state: events.state,
        country: events.country,
        isFree: events.isFree,
        ticketPrice: events.ticketPrice,
        featuredImage: events.featuredImage,
        status: events.status,
        organizer: { id: users.id, displayName: users.displayName, profileImageUrl: users.profileImageUrl },
        category: sql`${categories.name} as category_name`,
      })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(events.startDate)
        .limit(Number(limit))
        .offset(Number(offset)),

      db.select({ count: sql<number>`count(*)` })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(and(...conditions)),
    ]);

    return {
      data: eventsList,
      pagination: { total: Number(totalCount[0]?.count) || 0, limit: Number(limit), offset: Number(offset) },
    };
  }

  static async getUpcomingEvents(limit: string = '10') {
    const cacheKey = `${CacheKeys.EVENTS_UPCOMING}:${limit}`;
    return cacheService.getOrSet(cacheKey, async () => {
      const today = new Date();
      return db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        shortDescription: events.shortDescription,
        startDate: events.startDate,
        endDate: events.endDate,
        timezone: events.timezone,
        locationType: events.locationType,
        address: events.address,
        city: events.city,
        state: events.state,
        country: events.country,
        isFree: events.isFree,
        ticketPrice: events.ticketPrice,
        featuredImage: events.featuredImage,
        status: events.status,
        organizer: { id: users.id, displayName: users.displayName, profileImageUrl: users.profileImageUrl },
        category: sql`${categories.name} as category_name`,
      })
        .from(events)
        .leftJoin(users, eq(events.organizerId, users.id))
        .leftJoin(categories, eq(events.categoryId, categories.id))
        .where(and(gte(events.startDate, today), eq(events.status, 'published'), ne(events.status, 'cancelled')))
        .orderBy(events.startDate)
        .limit(Number(limit));
    }, CacheTTL.MEDIUM);
  }
}
