import { and, eq, gte, lte, ne, or, sql, SQL, count } from 'drizzle-orm';
import { events, categories, users, eventAttendees } from '../../schema.js';
import { db } from '../../db.js';
import { generateUniqueSlug } from './event.utils.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';

/**
 * Servicio para manejar la lógica de negocio de eventos
 */
export class EventService {
  /**
   * Obtiene un evento por su ID con sus relaciones
   */
  static async getEventById(eventId: number) {
    const event = await db.query.events.findFirst({
      where: (events: any, { eq }: any) => eq(events.id, eventId),
      with: {
        organizer: {
          columns: {
            id: true,
            displayName: true,
            profileImageUrl: true,
            email: true,
          },
        },
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (event) {
      // Incrementar el contador de vistas
      await db
        .update(events)
        .set({ viewCount: (event.viewCount || 0) + 1 })
        .where(eq(events.id, eventId));
    }

    return event;
  }

  /**
   * Crea un nuevo evento
   */
  static async createEvent(eventData: CreateEventInput, userId: string) {
    // Generar slug único
    const slug = await generateUniqueSlug(eventData.title);

    // Procesar fechas
    const startDate = eventData.startDate ? new Date(eventData.startDate) : new Date();
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    // Preparar datos para la creación
    const newEvent = {
      title: eventData.title,
      description: eventData.description,
      shortDescription: eventData.shortDescription || null,
      startDate: startDate,
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
      organizerId: userId, // Usuario autenticado
      companyId: eventData.companyId ? parseInt(eventData.companyId) : null, // Empresa organizadora
      viewCount: 0,
      saveCount: 0,
      shareCount: 0,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    };

    // Insertar en la base de datos
    const [newEventRecord] = await db
      .insert(events)
      .values(newEvent)
      .returning();

    return newEventRecord;
  }

  /**
   * Actualiza un evento existente
   */
  static async updateEvent(eventId: number, eventData: UpdateEventInput, userId: string) {
    // Verificar si el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!existingEvent) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar permisos
    if (existingEvent.organizerId !== userId) {
      throw new Error('FORBIDDEN');
    }

    // Preparar datos para la actualización
    const updateData: any = { ...eventData };

    // Si se actualiza el título, generar un nuevo slug
    if (updateData.title && updateData.title !== existingEvent.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, eventId);
    }

    // Procesar fechas
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }

    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    } else if (updateData.endDate === null) {
      updateData.endDate = null;
    }

    // Actualizar fecha de modificación
    updateData.updatedAt = new Date();

    // Eliminar campos que no se deben actualizar
    delete updateData.id;
    delete updateData.organizerId;
    delete updateData.createdAt;

    // Actualizar en la base de datos
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    return updatedEvent;
  }

  /**
   * Cancela un evento
   */
  static async cancelEvent(eventId: number, userId: string) {
    // Verificar si el evento existe
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!existingEvent) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar permisos
    if (existingEvent.organizerId !== userId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar que no esté ya cancelado
    if (existingEvent.status === 'cancelled') {
      throw new Error('ALREADY_CANCELLED');
    }

    // Actualizar estado
    const [cancelledEvent] = await db
      .update(events)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId))
      .returning();

    return cancelledEvent;
  }

  /**
   * Busca eventos con filtros
   */
  static async searchEvents(filters: EventFilterOptions) {
    const {
      query,
      category,
      startDate,
      endDate,
      isFree,
      location,
      eventType,
      limit = '20',
      offset = '0',
    } = filters;

    // Construir condiciones
    const conditions: SQL[] = [
      eq(events.status, 'published'),
      ne(events.status, 'cancelled')
    ];

    // Búsqueda por texto
    if (query && typeof query === 'string') {
      const searchTerm = `%${query}%`;
      const searchConditions: SQL[] = [
        sql`LOWER(${events.title}::text) LIKE LOWER(${searchTerm}::text)`,
        sql`LOWER(${events.description}::text) LIKE LOWER(${searchTerm}::text)`
      ];

      if (events.shortDescription) {
        searchConditions.push(
          sql`LOWER(${events.shortDescription}::text) LIKE LOWER(${searchTerm}::text)`
        );
      }

      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Filtrar por categoría
    if (category) {
      conditions.push(eq(categories.name, category));
    }

    // Filtrar por fechas
    if (startDate) {
      conditions.push(gte(events.startDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(events.endDate || events.startDate, new Date(endDate)));
    }

    // Filtrar por tipo
    if (eventType && typeof eventType === 'string') {
      const validEventTypes = ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other'];
      if (validEventTypes.includes(eventType)) {
        conditions.push(eq(events.eventType, eventType as any));
      }
    }

    // Filtrar por ubicación
    if (location && typeof location === 'string') {
      const locationTerm = `%${location}%`;
      const locationConditions: SQL[] = [];

      if (events.city) {
        locationConditions.push(sql`LOWER(${events.city}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.state) {
        locationConditions.push(sql`LOWER(${events.state}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.country) {
        locationConditions.push(sql`LOWER(${events.country}::text) LIKE LOWER(${locationTerm}::text)`);
      }
      if (events.venueName) {
        locationConditions.push(sql`LOWER(${events.venueName}::text) LIKE LOWER(${locationTerm}::text)`);
      }

      const locationCondition = or(...locationConditions);
      if (locationCondition) {
        conditions.push(locationCondition);
      }
    }

    // Filtrar por precio
    if (isFree !== undefined) {
      const isFreeBool = typeof isFree === 'string' ? isFree === 'true' : Boolean(isFree);
      conditions.push(eq(events.isFree, isFreeBool));
    }

    // Ejecutar queries
    const [eventsList, totalCount] = await Promise.all([
      db
        .select({
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
          organizer: {
            id: users.id,
            displayName: users.displayName,
            profileImageUrl: users.profileImageUrl,
          },
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
        .where(and(...conditions))
    ]);

    return {
      data: eventsList,
      pagination: {
        total: Number(totalCount[0]?.count) || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    };
  }

  /**
   * Obtiene próximos eventos
   */
  static async getUpcomingEvents(limit: string = '10') {
    const today = new Date();

    const upcomingEvents = await db
      .select({
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
        organizer: {
          id: users.id,
          displayName: users.displayName,
          profileImageUrl: users.profileImageUrl,
        },
        category: sql`${categories.name} as category_name`,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .where(
        and(
          gte(events.startDate, today),
          eq(events.status, 'published'),
          ne(events.status, 'cancelled')
        )
      )
      .orderBy(events.startDate)
      .limit(Number(limit));

    return upcomingEvents;
  }

  /**
   * Registra un usuario para un evento (Luma-style)
   */
  static async registerForEvent(eventId: number, userId: string, ticketTypeId?: number) {
    // Verificar si el evento existe
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verificar que el evento no esté cancelado
    if (event.status === 'cancelled') {
      throw new Error('EVENT_CANCELLED');
    }

    // Verificar si ya está registrado
    const [existingRegistration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    if (existingRegistration) {
      throw new Error('ALREADY_REGISTERED');
    }

    // Obtener estadísticas actuales
    const stats = await this.getAttendeeStats(eventId);

    // Determinar estado inicial
    let initialStatus: 'pending' | 'approved' | 'waitlisted' = 'pending';

    if (!event.requiresApproval) {
      // Si no requiere aprobación, aprobar automáticamente
      if (event.capacity && stats.approved >= event.capacity) {
        // Si está lleno y hay waitlist, poner en waitlist
        if (event.enableWaitlist) {
          initialStatus = 'waitlisted';
        } else {
          throw new Error('EVENT_FULL');
        }
      } else {
        initialStatus = 'approved';
      }
    } else {
      // Si requiere aprobación, dejar en pending
      initialStatus = 'pending';
    }

    // Crear registro
    const [newAttendee] = await db
      .insert(eventAttendees)
      .values({
        eventId,
        userId,
        ticketTypeId: ticketTypeId || null,
        status: initialStatus,
        registeredAt: new Date(),
        statusUpdatedAt: new Date(),
      })
      .returning();

    return newAttendee;
  }

  /**
   * Cancela el registro de un usuario para un evento
   */
  static async unregisterFromEvent(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    if (!registration) {
      throw new Error('REGISTRATION_NOT_FOUND');
    }

    // Eliminar registro
    await db
      .delete(eventAttendees)
      .where(eq(eventAttendees.id, registration.id));

    return { success: true };
  }

  /**
   * Obtiene todos los asistentes de un evento (solo organizador)
   */
  static async getEventAttendees(eventId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Obtener asistentes con información de usuario
    const attendees = await db
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

    return attendees;
  }

  /**
   * Aprueba un asistente
   */
  static async approveAttendee(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar capacidad
    const stats = await this.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) {
      throw new Error('EVENT_FULL');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'approved',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  /**
   * Rechaza un asistente
   */
  static async rejectAttendee(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'rejected',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  /**
   * Mueve un asistente a la lista de espera
   */
  static async moveToWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    if (!event.enableWaitlist) {
      throw new Error('WAITLIST_NOT_ENABLED');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'waitlisted',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  /**
   * Mueve un asistente de la lista de espera a aprobado
   */
  static async moveFromWaitlist(eventId: number, attendeeId: number, organizerId: string) {
    // Verificar ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('FORBIDDEN');
    }

    // Verificar capacidad
    const stats = await this.getAttendeeStats(eventId);
    if (event.capacity && stats.approved >= event.capacity) {
      throw new Error('EVENT_FULL');
    }

    // Actualizar estado
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({
        status: 'approved',
        statusUpdatedAt: new Date(),
      })
      .where(eq(eventAttendees.id, attendeeId))
      .returning();

    return updatedAttendee;
  }

  /**
   * Obtiene el registro de un usuario para un evento
   */
  static async getMyRegistration(eventId: number, userId: string) {
    const [registration] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, userId)
      ));

    return registration || null;
  }

  /**
   * Obtiene estadísticas de asistentes para un evento
   */
  static async getAttendeeStats(eventId: number) {
    const results = await db
      .select({
        status: eventAttendees.status,
        count: count(),
      })
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId))
      .groupBy(eventAttendees.status);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
      registered: 0,
      checked_in: 0,
    };

    results.forEach((result: any) => {
      if (result.status in stats) {
        stats[result.status as keyof typeof stats] = Number(result.count);
      }
    });

    // Obtener capacidad del evento
    const [event] = await db
      .select({ capacity: events.capacity })
      .from(events)
      .where(eq(events.id, eventId));

    const capacity = event?.capacity || 0;
    const availableSpots = capacity > 0 ? Math.max(0, capacity - stats.approved) : Infinity;

    return {
      ...stats,
      capacity,
      availableSpots,
    };
  }
}
