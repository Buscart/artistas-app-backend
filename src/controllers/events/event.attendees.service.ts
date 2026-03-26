import { and, eq, count, sql } from 'drizzle-orm';
import { events, users, eventAttendees } from '../../schema.js';
import { db } from '../../db.js';
import { cacheService } from '../../services/cache.service.js';

export class EventAttendeesService {
  static async getAttendeeStats(eventId: number) {
    const results = await db
      .select({ status: eventAttendees.status, count: count() })
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId))
      .groupBy(eventAttendees.status);

    const stats = { pending: 0, approved: 0, rejected: 0, waitlisted: 0, registered: 0, checked_in: 0 };
    results.forEach((result: any) => {
      if (result.status in stats) stats[result.status as keyof typeof stats] = Number(result.count);
    });

    const [event] = await db.select({ capacity: events.capacity }).from(events).where(eq(events.id, eventId));
    const capacity = event?.capacity || 0;
    const availableSpots = capacity > 0 ? Math.max(0, capacity - stats.approved) : Infinity;

    return { ...stats, capacity, availableSpots };
  }

  static async registerForEvent(eventId: number, userId: string, ticketTypeId?: number) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.status === 'cancelled') throw new Error('EVENT_CANCELLED');

    const [existingRegistration] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));

    if (existingRegistration) throw new Error('ALREADY_REGISTERED');

    const stats = await EventAttendeesService.getAttendeeStats(eventId);

    let initialStatus: 'pending' | 'approved' | 'waitlisted' = 'pending';
    if (!event.requiresApproval) {
      if (event.capacity && stats.approved >= event.capacity) {
        if (event.enableWaitlist) {
          initialStatus = 'waitlisted';
        } else {
          throw new Error('EVENT_FULL');
        }
      } else {
        initialStatus = 'approved';
      }
    }

    const [newAttendee] = await db
      .insert(eventAttendees)
      .values({ eventId, userId, ticketTypeId: ticketTypeId || null, status: initialStatus, registeredAt: new Date(), statusUpdatedAt: new Date() })
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    cacheService.invalidateUserEvents(userId);

    return newAttendee;
  }

  static async unregisterFromEvent(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));

    if (!registration) throw new Error('REGISTRATION_NOT_FOUND');

    await db.delete(eventAttendees).where(eq(eventAttendees.id, registration.id));

    cacheService.invalidateEventAttendees(eventId);
    cacheService.invalidateUserEvents(userId);

    return { success: true };
  }

  static async getMyRegistration(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)));
    return registration || null;
  }

  static async getEventAttendees(eventId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    return db
      .select({
        id: eventAttendees.id,
        eventId: eventAttendees.eventId,
        userId: eventAttendees.userId,
        status: eventAttendees.status,
        ticketTypeId: eventAttendees.ticketTypeId,
        registeredAt: eventAttendees.registeredAt,
        statusUpdatedAt: eventAttendees.statusUpdatedAt,
        checkedInAt: eventAttendees.checkedInAt,
        notes: eventAttendees.notes,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(eventAttendees)
      .leftJoin(users, eq(eventAttendees.userId, users.id))
      .where(eq(eventAttendees.eventId, eventId))
      .orderBy(eventAttendees.registeredAt);
  }

  static async approveAttendee(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const stats = await EventAttendeesService.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) throw new Error('EVENT_FULL');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ status: 'approved', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    return updatedAttendee;
  }

  static async rejectAttendee(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ status: 'rejected', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    return updatedAttendee;
  }

  static async moveToWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');
    if (!event.enableWaitlist) throw new Error('WAITLIST_NOT_ENABLED');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ status: 'waitlisted', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    return updatedAttendee;
  }

  static async moveFromWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const stats = await EventAttendeesService.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) throw new Error('EVENT_FULL');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ status: 'approved', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  static async checkInAttendee(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const [attendee] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.id, attendeeId), eq(eventAttendees.eventId, eventId)));

    if (!attendee) throw new Error('ATTENDEE_NOT_FOUND');
    if (attendee.status !== 'approved') throw new Error('ATTENDEE_NOT_APPROVED');
    if (attendee.checkedInAt) throw new Error('ALREADY_CHECKED_IN');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ checkedInAt: new Date(), checkedInBy: organizerId, status: 'checked_in', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    if (attendee.userId) cacheService.invalidateUserEvents(attendee.userId);

    return updatedAttendee;
  }

  static async undoCheckIn(eventId: number, attendeeId: number, organizerId: string) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.organizerId !== organizerId) throw new Error('FORBIDDEN');

    const [attendee] = await db
      .select()
      .from(eventAttendees)
      .where(and(eq(eventAttendees.id, attendeeId), eq(eventAttendees.eventId, eventId)));

    if (!attendee) throw new Error('ATTENDEE_NOT_FOUND');
    if (!attendee.checkedInAt) throw new Error('NOT_CHECKED_IN');

    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ checkedInAt: null, checkedInBy: null, status: 'approved', statusUpdatedAt: new Date() })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    cacheService.invalidateEventAttendees(eventId);
    if (attendee.userId) cacheService.invalidateUserEvents(attendee.userId);

    return updatedAttendee;
  }
}
