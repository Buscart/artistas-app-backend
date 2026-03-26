import { Request, Response } from 'express';
import { EventCrudService } from './event.crud.service.js';
import { EventAttendeesService } from './event.attendees.service.js';
import { EventReviewsService } from './event.reviews.service.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';
import { createEventSchema, updateEventSchema } from './event.validations.js';
import { CertificateService } from '../../services/certificate.service.js';

class EventController {
  // ── CRUD ──────────────────────────────────────────────────────────────────────

  static async getEventById(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ error: 'ID de evento no válido' });

      const event = await EventCrudService.getEventById(eventId, (req as any).user?.id);
      if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

      const organizer = event.organizer ? {
        ...event.organizer,
        name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Organizador',
        avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        verified: event.organizer.isVerified || false,
        eventsCount: 0,
        rating: 0,
      } : null;

      const agenda = event.agenda?.map((item: any) => ({
        time: item.startTime ? new Date(item.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '',
        title: item.title,
        description: item.description,
        speaker: item.speakerName ? { name: item.speakerName, title: item.speakerTitle, image: item.speakerImage } : null,
      })) || [];

      const reviews = event.reviews?.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        organizerResponse: review.organizerResponse,
        user: review.user ? {
          id: review.user.id,
          name: review.user.displayName || `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim(),
          avatar: review.user.profileImageUrl || '/images/default-avatar.png',
        } : null,
      })) || [];

      return res.status(200).json({
        ...event,
        rating: event.reviewStats?.average || 0,
        reviewCount: event.reviewStats?.count || 0,
        agenda,
        reviews,
        organizer,
      });
    } catch (error) {
      console.error('Error al obtener el evento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getCompanyEvents(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.companyId, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'ID de empresa no válido' });
      const data = await EventCrudService.getCompanyEvents(id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener eventos de empresa:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getMyEvents(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const data = await EventCrudService.getMyEvents(req.user.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error al obtener mis eventos:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createEvent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'No autorizado', code: 'UNAUTHORIZED' });

      const eventData: CreateEventInput = req.body;
      const validationResult = createEventSchema.safeParse(eventData);
      if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Datos de entrada inválidos', errors: validationResult.error.issues, code: 'VALIDATION_ERROR' });
      }

      const newEvent = await EventCrudService.createEvent(eventData, req.user.id);
      return res.status(201).json({ success: true, message: 'Evento creado exitosamente', data: newEvent, code: 'EVENT_CREATED' });
    } catch (error: any) {
      if (res.headersSent) return;
      if (error.code === '23505') return res.status(409).json({ success: false, error: 'Conflicto', code: 'DUPLICATE_ENTRY' });
      if (error.code?.startsWith('23')) return res.status(500).json({ success: false, error: 'Error de base de datos', code: 'DATABASE_ERROR' });
      return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' });
    }
  }

  static async updateEvent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'No autorizado', code: 'UNAUTHORIZED' });

      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ success: false, error: 'ID de evento no válido', code: 'INVALID_EVENT_ID' });

      const eventData: UpdateEventInput = req.body;
      const validationResult = updateEventSchema.safeParse({ ...eventData, id: eventId });
      if (!validationResult.success) {
        return res.status(400).json({ success: false, error: 'Datos de entrada inválidos', errors: validationResult.error.issues, code: 'VALIDATION_ERROR' });
      }

      const updatedEvent = await EventCrudService.updateEvent(eventId, eventData, req.user.id);
      return res.json({ success: true, data: updatedEvent, message: 'Evento actualizado correctamente', code: 'EVENT_UPDATED' });
    } catch (error: any) {
      if (res.headersSent) return;
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ success: false, error: 'Evento no encontrado', code: 'EVENT_NOT_FOUND' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ success: false, error: 'No autorizado', code: 'FORBIDDEN' });
      return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' });
    }
  }

  static async cancelEvent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'No autorizado', code: 'UNAUTHORIZED' });

      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ success: false, error: 'ID de evento no válido', code: 'INVALID_EVENT_ID' });

      const cancelledEvent = await EventCrudService.cancelEvent(eventId, userId);
      return res.status(200).json({ success: true, message: 'Evento cancelado exitosamente', data: cancelledEvent });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ success: false, error: 'Evento no encontrado', code: 'EVENT_NOT_FOUND' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ success: false, error: 'No autorizado', code: 'FORBIDDEN' });
      if (error.message === 'ALREADY_CANCELLED') return res.status(400).json({ success: false, error: 'El evento ya está cancelado', code: 'ALREADY_CANCELLED' });
      return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' });
    }
  }

  static async deleteEvent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'No autorizado', code: 'UNAUTHORIZED' });

      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) return res.status(400).json({ success: false, error: 'ID de evento no válido', code: 'INVALID_EVENT_ID' });

      const deletedEvent = await EventCrudService.deleteEvent(eventId, req.user.id);
      return res.status(200).json({ success: true, message: 'Evento eliminado exitosamente', data: deletedEvent });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ success: false, error: 'Evento no encontrado', code: 'EVENT_NOT_FOUND' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ success: false, error: 'No autorizado', code: 'FORBIDDEN' });
      if (error.message === 'HAS_ATTENDEES') return res.status(400).json({ success: false, error: 'No se puede eliminar', message: 'No puedes eliminar un evento que tiene asistentes. Cancela el evento en su lugar.', code: 'HAS_ATTENDEES' });
      return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' });
    }
  }

  static async searchEvents(req: Request, res: Response) {
    try {
      const filters = req.query as unknown as EventFilterOptions;
      const result = await EventCrudService.searchEvents(filters);
      res.status(200).json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ message: 'Error al buscar eventos', error: errorMessage });
    }
  }

  static async getUpcomingEvents(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const upcomingEvents = await EventCrudService.getUpcomingEvents(limit as string);
      res.status(200).json(upcomingEvents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ message: 'Error al obtener los próximos eventos', error: errorMessage });
    }
  }

  // ── ASISTENTES ────────────────────────────────────────────────────────────────

  static async registerForEvent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const { ticketTypeId } = req.body;
      const attendee = await EventAttendeesService.registerForEvent(parseInt(req.params.eventId), req.user.id, ticketTypeId);
      res.status(201).json({ success: true, message: 'Registro exitoso', data: attendee });
    } catch (error: any) {
      const errorMap: Record<string, [number, string]> = {
        EVENT_NOT_FOUND: [404, 'Evento no encontrado'],
        EVENT_CANCELLED: [400, 'El evento ha sido cancelado'],
        ALREADY_REGISTERED: [400, 'Ya estás registrado para este evento'],
        EVENT_FULL: [400, 'El evento está lleno'],
      };
      const [status, message] = errorMap[error.message] || [500, 'Error al procesar el registro'];
      res.status(status).json({ error: message });
    }
  }

  static async unregisterFromEvent(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      await EventAttendeesService.unregisterFromEvent(parseInt(req.params.eventId), req.user.id);
      res.status(200).json({ success: true, message: 'Registro cancelado exitosamente' });
    } catch (error: any) {
      if (error.message === 'REGISTRATION_NOT_FOUND') return res.status(404).json({ error: 'Registro no encontrado' });
      res.status(500).json({ error: 'Error al cancelar el registro' });
    }
  }

  static async getMyRegistration(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const registration = await EventAttendeesService.getMyRegistration(parseInt(req.params.eventId), req.user.id);
      res.status(200).json({ success: true, data: registration });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el registro' });
    }
  }

  static async getEventAttendees(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendees = await EventAttendeesService.getEventAttendees(parseInt(req.params.eventId), req.user.id);
      res.status(200).json({ success: true, data: attendees });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'No tienes permisos para ver los asistentes' });
      res.status(500).json({ error: 'Error al obtener los asistentes' });
    }
  }

  static async getAttendeeStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const eventId = parseInt(req.params.eventId);
      const stats = await EventAttendeesService.getAttendeeStats(eventId);
      const isOrganizer = await EventCrudService.isEventOrganizer(eventId, userId);

      if (!isOrganizer) {
        return res.status(200).json({ success: true, data: { approved: stats.approved, capacity: stats.capacity, availableSpots: stats.availableSpots } });
      }
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }

  static async approveAttendee(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.approveAttendee(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Asistente aprobado', data: attendee });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      if (error.message === 'EVENT_FULL') return res.status(400).json({ error: 'El evento está lleno' });
      res.status(500).json({ error: 'Error al aprobar el asistente' });
    }
  }

  static async rejectAttendee(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.rejectAttendee(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Asistente rechazado', data: attendee });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      res.status(500).json({ error: 'Error al rechazar el asistente' });
    }
  }

  static async moveToWaitlist(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.moveToWaitlist(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Asistente movido a lista de espera', data: attendee });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      if (error.message === 'WAITLIST_NOT_ENABLED') return res.status(400).json({ error: 'La lista de espera no está habilitada' });
      res.status(500).json({ error: 'Error al mover a lista de espera' });
    }
  }

  static async moveFromWaitlist(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.moveFromWaitlist(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Asistente aprobado desde lista de espera', data: attendee });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'No tienes permisos para gestionar asistentes' });
      if (error.message === 'EVENT_FULL') return res.status(400).json({ error: 'El evento está lleno' });
      res.status(500).json({ error: 'Error al aprobar desde lista de espera' });
    }
  }

  static async checkInAttendee(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.checkInAttendee(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Check-in realizado exitosamente', data: attendee });
    } catch (error: any) {
      const errorMap: Record<string, [number, string]> = {
        EVENT_NOT_FOUND: [404, 'Evento no encontrado'],
        FORBIDDEN: [403, 'No tienes permisos para gestionar asistentes'],
        ATTENDEE_NOT_FOUND: [404, 'Asistente no encontrado'],
        ATTENDEE_NOT_APPROVED: [400, 'El asistente no está aprobado para el evento'],
        ALREADY_CHECKED_IN: [400, 'El asistente ya hizo check-in'],
      };
      const [status, message] = errorMap[error.message] || [500, 'Error al realizar el check-in'];
      res.status(status).json({ error: message });
    }
  }

  static async undoCheckIn(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const attendee = await EventAttendeesService.undoCheckIn(parseInt(req.params.eventId), parseInt(req.params.attendeeId), req.user.id);
      res.status(200).json({ success: true, message: 'Check-in revertido exitosamente', data: attendee });
    } catch (error: any) {
      const errorMap: Record<string, [number, string]> = {
        EVENT_NOT_FOUND: [404, 'Evento no encontrado'],
        FORBIDDEN: [403, 'No tienes permisos para gestionar asistentes'],
        ATTENDEE_NOT_FOUND: [404, 'Asistente no encontrado'],
        NOT_CHECKED_IN: [400, 'El asistente no tiene check-in registrado'],
      };
      const [status, message] = errorMap[error.message] || [500, 'Error al revertir el check-in'];
      res.status(status).json({ error: message });
    }
  }

  // ── RESEÑAS + HISTORIAL + CERTIFICADOS ────────────────────────────────────────

  static async createReview(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const { rating, title, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });

      const review = await EventReviewsService.createReview(parseInt(req.params.eventId), req.user.id, { rating, title, comment });
      res.status(201).json({ success: true, message: 'Reseña creada exitosamente', data: review });
    } catch (error: any) {
      if (error.message === 'NOT_ATTENDEE') return res.status(403).json({ error: 'No puedes reseñar un evento al que no asististe' });
      if (error.message === 'NOT_CHECKED_IN') return res.status(403).json({ error: 'Debes haber hecho check-in para dejar una reseña' });
      if (error.message === 'ALREADY_REVIEWED') return res.status(400).json({ error: 'Ya dejaste una reseña para este evento' });
      res.status(500).json({ error: 'Error al crear la reseña' });
    }
  }

  static async getEventReviews(req: Request, res: Response) {
    try {
      const reviews = await EventReviewsService.getEventReviews(parseInt(req.params.eventId));
      res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las reseñas' });
    }
  }

  static async respondToReview(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const { response } = req.body;
      if (!response || typeof response !== 'string' || response.trim().length === 0) return res.status(400).json({ error: 'La respuesta es requerida' });
      if (response.length > 1000) return res.status(400).json({ error: 'La respuesta no puede exceder 1000 caracteres' });

      const updatedReview = await EventReviewsService.respondToReview(parseInt(req.params.eventId), parseInt(req.params.reviewId), req.user.id, response);
      res.status(200).json({ success: true, message: 'Respuesta agregada exitosamente', data: updatedReview });
    } catch (error: any) {
      if (error.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Evento no encontrado' });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Solo el organizador puede responder reseñas' });
      if (error.message === 'REVIEW_NOT_FOUND') return res.status(404).json({ error: 'Reseña no encontrada' });
      res.status(500).json({ error: 'Error al responder la reseña' });
    }
  }

  static async getRegisteredEvents(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const events = await EventReviewsService.getRegisteredEvents(req.user.id);
      const formattedEvents = events.map((event: any) => ({
        ...event,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim(),
          avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        } : null,
      }));
      res.status(200).json({ success: true, data: formattedEvents });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los eventos registrados' });
    }
  }

  static async getAttendedEvents(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const events = await EventReviewsService.getAttendedEvents(req.user.id);
      const formattedEvents = events.map((event: any) => ({
        ...event,
        organizer: event.organizer ? {
          id: event.organizer.id,
          name: event.organizer.displayName || `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim(),
          avatar: event.organizer.profileImageUrl || '/images/default-avatar.png',
        } : null,
      }));
      res.status(200).json({ success: true, data: formattedEvents });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el historial de asistencia' });
    }
  }

  static async generateCertificate(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autorizado' });
      const { eventId } = req.params;
      const userId = req.user.id;
      const format = req.query.format as string;

      const certificateData = await EventReviewsService.generateCertificate(parseInt(eventId), userId);

      if (format === 'json') return res.status(200).json({ success: true, data: certificateData });

      const certificateCode = CertificateService.generateCertificateCode(parseInt(eventId), userId);
      const pdfBuffer = await CertificateService.generatePDF({
        eventId: parseInt(eventId),
        eventTitle: certificateData.eventTitle,
        eventDate: new Date(certificateData.eventDate),
        eventEndDate: certificateData.eventEndDate ? new Date(certificateData.eventEndDate) : undefined,
        eventLocation: certificateData.eventLocation,
        attendeeName: certificateData.attendeeName,
        attendeeId: userId,
        checkedInAt: new Date(certificateData.checkedInAt),
        certificateCode,
      });

      const filename = `certificado-${certificateData.eventTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (error: any) {
      if (error.message === 'NOT_ATTENDEE') return res.status(403).json({ error: 'No asististe a este evento' });
      if (error.message === 'NOT_APPROVED') return res.status(403).json({ error: 'Tu registro no fue aprobado' });
      if (error.message === 'NOT_CHECKED_IN') return res.status(403).json({ error: 'No hiciste check-in en este evento' });
      res.status(500).json({ error: 'Error al generar el certificado' });
    }
  }
}

export default EventController;
