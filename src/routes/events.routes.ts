import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { EventController } from '../controllers/events/index.js';
import ticketTypesRoutes from './ticketTypes.routes.js';

const eventsRoutes = Router();

/**
 * GET /api/v1/events/search
 * Buscar eventos por nombre/descripción
 */
import ExplorerController from '../controllers/explorer.controller.js';
eventsRoutes.get('/search', ExplorerController.searchEvents);

/**
 * GET /api/v1/events
 * Obtener todos los eventos públicos
 */
// Obtener todos los eventos públicos
eventsRoutes.get('/', EventController.searchEvents);

/**
 * GET /api/v1/events/upcoming
 * Obtener próximos eventos
 */
eventsRoutes.get('/upcoming', EventController.getUpcomingEvents);

/**
 * GET /api/v1/events/my
 * Obtener eventos del usuario autenticado (requiere auth)
 */
// TODO: Implementar getMyEvents en el controlador
// eventsRoutes.get('/my', authMiddleware, EventController.getMyEvents);

/**
 * GET /api/v1/events/:id
 * Obtener detalle de un evento
 */
eventsRoutes.get('/:id', EventController.getEventById);

/**
 * POST /api/v1/events
 * Crear un nuevo evento (requiere auth)
 */
eventsRoutes.post('/', authMiddleware, EventController.createEvent);

/**
 * PUT /api/v1/events/:id
 * Actualizar un evento (requiere auth)
 */
eventsRoutes.put('/:id', authMiddleware, EventController.updateEvent);

/**
 * PATCH /api/v1/events/:id/cancel
 * Cancelar un evento (requiere auth)
 */
eventsRoutes.patch('/:id/cancel', authMiddleware, EventController.cancelEvent);

/**
 * DELETE /api/v1/events/:id
 * Eliminar un evento (requiere auth)
 */
// TODO: Implementar deleteEvent en el controlador
// eventsRoutes.delete('/:id', authMiddleware, EventController.deleteEvent);

// ========== GESTIÓN DE ASISTENTES (Luma-style) ==========

/**
 * POST /api/v1/events/:eventId/register
 * Registrarse para un evento (requiere auth)
 */
eventsRoutes.post('/:eventId/register', authMiddleware, EventController.registerForEvent);

/**
 * DELETE /api/v1/events/:eventId/unregister
 * Cancelar registro para un evento (requiere auth)
 */
eventsRoutes.delete('/:eventId/unregister', authMiddleware, EventController.unregisterFromEvent);

/**
 * GET /api/v1/events/:eventId/my-registration
 * Obtener mi registro para un evento (requiere auth)
 */
eventsRoutes.get('/:eventId/my-registration', authMiddleware, EventController.getMyRegistration);

/**
 * GET /api/v1/events/:eventId/attendees
 * Obtener todos los asistentes de un evento (solo organizador, requiere auth)
 */
eventsRoutes.get('/:eventId/attendees', authMiddleware, EventController.getEventAttendees);

/**
 * GET /api/v1/events/:eventId/attendees/stats
 * Obtener estadísticas de asistentes (público)
 */
eventsRoutes.get('/:eventId/attendees/stats', EventController.getAttendeeStats);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/approve
 * Aprobar un asistente (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/approve', authMiddleware, EventController.approveAttendee);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/reject
 * Rechazar un asistente (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/reject', authMiddleware, EventController.rejectAttendee);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/move-to-waitlist
 * Mover a lista de espera (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/move-to-waitlist', authMiddleware, EventController.moveToWaitlist);

/**
 * POST /api/v1/events/:eventId/attendees/:attendeeId/move-from-waitlist
 * Mover desde lista de espera a aprobado (solo organizador, requiere auth)
 */
eventsRoutes.post('/:eventId/attendees/:attendeeId/move-from-waitlist', authMiddleware, EventController.moveFromWaitlist);

/**
 * /api/v1/events/:eventId/ticket-types
 * Rutas de tipos de entradas/boletos para eventos
 */
eventsRoutes.use('/:eventId/ticket-types', ticketTypesRoutes);

export default eventsRoutes;
