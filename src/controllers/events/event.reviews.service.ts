import { and, eq, ne, or, lte, gte, sql, desc } from 'drizzle-orm';
import { events, users, eventAttendees, eventReviews } from '../../schema.js';
import { db } from '../../db.js';
import { cacheService, CacheKeys, CacheTTL } from '../../services/cache.service.js';

export class EventReviewsService {
  static async createReview(eventId: number, userId: string, data: { rating: number; title?: string; comment?: string }) {
    const [attendance] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId), eq(eventAttendees.status, 'approved')));

    if (!attendance) throw new Error('NOT_ATTENDEE');
    if (!attendance.checkedInAt) throw new Error('NOT_CHECKED_IN');

    const [existingReview] = await db
      .select()
      .from(eventReviews)
      .where(and(eq(eventReviews.eventId, eventId), eq(eventReviews.userId, userId)));

    if (existingReview) throw new Error('ALREADY_REVIEWED');

    const [review] = await db
      .insert(eventReviews)
      .values({ eventId, userId, rating: data.rating, title: data.title || null, comment: data.comment || null, isVerified: true })
      .returning();

    return review;
  }

  static async getEventReviews(eventId: number) {
    return db
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
  }

  static async respondToReview(eventId: number, reviewId: number, organizerId: string, response: string) {
    const [event] = await db.select({ organizerId: events.organizerId }).from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const [review] = await db
      .select()
      .from(eventReviews)
      .where(and(eq(eventReviews.id, reviewId), eq(eventReviews.eventId, eventId)));
    if (!review) throw new Error('REVIEW_NOT_FOUND');

    const [updatedReview] = await db
      .update(eventReviews)
      .set({ organizerResponse: response.trim(), organizerResponseAt: new Date() })
      .where(eq(eventReviews.id, reviewId))
      .returning();

    return updatedReview;
  }

  static async getAttendedEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_ATTENDED(userId);
    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();

      const attendedEvents = await db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          shortDescription: events.shortDescription,
          description: events.description,
          startDate: events.startDate,
          endDate: events.endDate,
          featuredImage: events.featuredImage,
          city: events.city,
          address: events.address,
          country: events.country,
          locationType: events.locationType,
          status: events.status,
          capacity: events.capacity,
          availableTickets: events.availableTickets,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          tags: events.tags,
          organizerId: events.organizerId,
          registrationStatus: eventAttendees.status,
          registeredAt: eventAttendees.registeredAt,
          checkedInAt: eventAttendees.checkedInAt,
          certificateUrl: eventAttendees.certificateUrl,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(eventAttendees)
        .innerJoin(events, eq(eventAttendees.eventId, events.id))
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(eventAttendees.userId, userId),
          ne(events.organizerId, userId),
          or(lte(events.startDate, now), eq(events.status, 'completed'), sql`${eventAttendees.checkedInAt} IS NOT NULL`)
        ))
        .orderBy(desc(events.startDate));

      const eventIds = attendedEvents.map(e => e.id);
      let userReviewsSet = new Set<number>();
      if (eventIds.length > 0) {
        const userReviews = await db
          .select({ eventId: eventReviews.eventId })
          .from(eventReviews)
          .where(and(eq(eventReviews.userId, userId), sql`${eventReviews.eventId} = ANY(${eventIds})`));
        userReviewsSet = new Set(userReviews.map(r => r.eventId));
      }

      return attendedEvents.map(event => {
        const hasReviewed = userReviewsSet.has(event.id);
        return {
          ...event,
          hasReviewed,
          canReview: event.registrationStatus === 'approved' && event.checkedInAt && !hasReviewed,
          canDownloadCertificate: event.registrationStatus === 'approved' && !!event.checkedInAt,
        };
      });
    }, CacheTTL.SHORT);
  }

  static async getRegisteredEvents(userId: string) {
    const cacheKey = CacheKeys.EVENTS_REGISTERED(userId);
    return cacheService.getOrSet(cacheKey, async () => {
      const now = new Date();
      return db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          shortDescription: events.shortDescription,
          startDate: events.startDate,
          endDate: events.endDate,
          featuredImage: events.featuredImage,
          city: events.city,
          address: events.address,
          country: events.country,
          locationType: events.locationType,
          onlineEventUrl: events.onlineEventUrl,
          status: events.status,
          capacity: events.capacity,
          availableTickets: events.availableTickets,
          isFree: events.isFree,
          ticketPrice: events.ticketPrice,
          tags: events.tags,
          organizerId: events.organizerId,
          registrationStatus: eventAttendees.status,
          registeredAt: eventAttendees.registeredAt,
          organizer: {
            id: users.id,
            displayName: users.displayName,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(eventAttendees)
        .innerJoin(events, eq(eventAttendees.eventId, events.id))
        .leftJoin(users, eq(events.organizerId, users.id))
        .where(and(
          eq(eventAttendees.userId, userId),
          ne(events.organizerId, userId),
          gte(events.startDate, now),
          ne(events.status, 'cancelled')
        ))
        .orderBy(events.startDate);
    }, CacheTTL.MEDIUM);
  }

  static async generateCertificate(eventId: number, userId: string) {
    const [attendance] = await db
      .select({ id: eventAttendees.id, status: eventAttendees.status, checkedInAt: eventAttendees.checkedInAt, certificateUrl: eventAttendees.certificateUrl })
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));

    if (!attendance) throw new Error('NOT_ATTENDEE');
    if (attendance.status !== 'approved') throw new Error('NOT_APPROVED');
    if (!attendance.checkedInAt) throw new Error('NOT_CHECKED_IN');

    const [event] = await db
      .select({ title: events.title, startDate: events.startDate, endDate: events.endDate, venueName: events.venueName, city: events.city })
      .from(events)
      .where(eq(events.id, eventId));

    const [user] = await db
      .select({ displayName: users.displayName, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId));

    if (!event || !user) throw new Error('DATA_NOT_FOUND');

    const userName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return {
      eventId,
      userId,
      eventTitle: event.title,
      eventDate: event.startDate,
      eventEndDate: event.endDate,
      eventLocation: event.venueName || event.city || 'Virtual',
      attendeeName: userName,
      checkedInAt: attendance.checkedInAt,
      certificateCode: `CERT-${eventId}-${Date.now().toString(36).toUpperCase()}`,
    };
  }
}
