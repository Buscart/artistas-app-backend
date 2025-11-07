import { Request, Response } from 'express';
import { EventService } from './event.service.js';
import { CreateEventInput, UpdateEventInput, EventFilterOptions } from './event.types.js';
import { createEventSchema, updateEventSchema } from './event.validations.js';

/**
 * Controlador de eventos - Maneja las peticiones HTTP
 */
class EventController {
  /**
   * Obtiene un evento por su ID
   */
  static async getEventById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventId = parseInt(id, 10);

      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'ID de evento no válido' });
      }

      const event = await EventService.getEventById(eventId);

      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // Formatear respuesta
      const response = {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        shortDescription: event.shortDescription,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        locationType: event.locationType,
        address: event.address,
        city: event.city,
        state: event.state,
        country: event.country,
        coordinates: event.coordinates,
        onlineEventUrl: event.onlineEventUrl,
        venueName: event.venueName,
        venueDescription: event.venueDescription,
        isFree: event.isFree,
        ticketPrice: event.ticketPrice,
        ticketUrl: event.ticketUrl,
        capacity: event.capacity,
        availableTickets: event.availableTickets,
        featuredImage: event.featuredImage,
        gallery: event.gallery || [],
        videoUrl: event.videoUrl,
        status: event.status,
        isFeatured: event.isFeatured,
        isRecurring: event.isRecurring,
        recurrencePattern: event.recurrencePattern,
        category: event.category,
        subcategories: event.subcategories || [],
        tags: event.tags || [],
        eventType: event.eventType,
        viewCount: event.viewCount,
        saveCount: event.saveCount,
        shareCount: event.shareCount,
        organizer: event.organizer,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error al obtener el evento:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Crea un nuevo evento
   */
  static async createEvent(req: Request, res: Response) {
    console.log('=== Iniciando creación de evento ===');

    try {
      // Verificar autenticación
      if (!req.user) {
        console.error('Intento de crear evento sin autenticación');
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para crear un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const eventData: CreateEventInput = req.body;
      const userId = req.user._id;

      console.log(`✅ Usuario autenticado: ${userId}`);

      // Validar datos de entrada
      const validationResult = createEventSchema.safeParse(eventData);
      if (!validationResult.success) {
        console.error('❌ Error de validación:', validationResult.error.issues);
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          message: 'Por favor, revisa los datos del evento',
          errors: validationResult.error.issues,
          code: 'VALIDATION_ERROR'
        });
      }

      console.log('✅ Validación de datos exitosa');

      // Crear evento usando el servicio
      const newEvent = await EventService.createEvent(eventData, userId);

      console.log('✅ Evento creado exitosamente:', newEvent.id);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: newEvent,
        code: 'EVENT_CREATED'
      });

    } catch (error: any) {
      console.error('❌ Error en createEvent:', error);

      if (res.headersSent) {
        return;
      }

      // Manejar errores específicos
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Conflicto',
          message: 'Ya existe un evento con un identificador similar',
          code: 'DUPLICATE_ENTRY'
        });
      }

      if (error.code?.startsWith('23')) {
        return res.status(500).json({
          success: false,
          error: 'Error de base de datos',
          message: 'Ocurrió un error al procesar la solicitud',
          code: 'DATABASE_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo crear el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualiza un evento existente
   */
  static async updateEvent(req: Request, res: Response) {
    console.log('=== Iniciando actualización de evento ===');

    try {
      // Verificar autenticación
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para actualizar un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const { id } = req.params;
      const eventId = parseInt(id, 10);
      const userId = req.user._id;
      const eventData: UpdateEventInput = req.body;

      // Validar ID
      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de evento no válido',
          code: 'INVALID_EVENT_ID'
        });
      }

      // Validar datos
      const validationResult = updateEventSchema.safeParse({ ...eventData, id: eventId });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          message: 'Por favor, revisa los datos del evento',
          errors: validationResult.error.issues,
          code: 'VALIDATION_ERROR'
        });
      }

      // Actualizar usando el servicio
      const updatedEvent = await EventService.updateEvent(eventId, eventData, userId);

      console.log('✅ Evento actualizado correctamente');

      return res.json({
        success: true,
        data: updatedEvent,
        message: 'Evento actualizado correctamente',
        code: 'EVENT_UPDATED'
      });

    } catch (error: any) {
      console.error('❌ Error al actualizar el evento:', error);

      if (res.headersSent) {
        return;
      }

      // Manejar errores del servicio
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado',
          code: 'EVENT_NOT_FOUND'
        });
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          error: 'No autorizado',
          message: 'Solo el organizador del evento puede actualizarlo',
          code: 'FORBIDDEN'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancela un evento
   */
  static async cancelEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'No autorizado',
          message: 'Debes iniciar sesión para cancelar un evento',
          code: 'UNAUTHORIZED'
        });
      }

      const eventId = parseInt(id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de evento no válido',
          code: 'INVALID_EVENT_ID'
        });
      }

      // Cancelar usando el servicio
      const cancelledEvent = await EventService.cancelEvent(eventId, userId);

      return res.status(200).json({
        success: true,
        message: 'Evento cancelado exitosamente',
        data: cancelledEvent
      });

    } catch (error: any) {
      console.error('Error al cancelar el evento:', error);

      // Manejar errores del servicio
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado',
          code: 'EVENT_NOT_FOUND'
        });
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          success: false,
          error: 'No autorizado',
          message: 'Solo el organizador puede cancelar este evento',
          code: 'FORBIDDEN'
        });
      }

      if (error.message === 'ALREADY_CANCELLED') {
        return res.status(400).json({
          success: false,
          error: 'El evento ya está cancelado',
          code: 'ALREADY_CANCELLED'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: 'No se pudo cancelar el evento',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca eventos con filtros
   */
  static async searchEvents(req: Request, res: Response) {
    try {
      const filters = req.query as unknown as EventFilterOptions;
      const result = await EventService.searchEvents(filters);

      res.status(200).json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al buscar eventos:', error);
      res.status(500).json({
        message: 'Error al buscar eventos',
        error: errorMessage
      });
    }
  }

  /**
   * Obtiene los próximos eventos
   */
  static async getUpcomingEvents(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const upcomingEvents = await EventService.getUpcomingEvents(limit as string);

      res.status(200).json(upcomingEvents);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al obtener próximos eventos:', error);
      res.status(500).json({
        message: 'Error al obtener los próximos eventos',
        error: errorMessage
      });
    }
  }
}

export default EventController;
