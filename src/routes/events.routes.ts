import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { EventController } from '../controllers/events/index.js';
import ticketTypesRoutes from './ticketTypes.routes.js';

const eventsRoutes = Router();

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

/**
 * /api/v1/events/:eventId/ticket-types
 * Rutas de tipos de entradas/boletos para eventos
 */
eventsRoutes.use('/:eventId/ticket-types', ticketTypesRoutes);

export default eventsRoutes;
