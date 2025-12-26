import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as hiringController from '../controllers/hiring.controller.js';
import * as collaborationsController from '../controllers/collaborations.controller.js';
import EventController from '../controllers/events/event.controller.js';

const hiringRoutes = Router();

/**
 * GET /api/v1/hiring
 * Obtener todas las ofertas de trabajo activas (público)
 */
hiringRoutes.get('/', hiringController.getAllHiringRequests);

/**
 * POST /api/v1/hiring
 * Crear nueva oferta de trabajo (requiere auth)
 */
hiringRoutes.post('/', authMiddleware, hiringController.createHiringRequest);

/**
 * GET /api/v1/hiring/my
 * Obtener mis ofertas publicadas (requiere auth)
 */
hiringRoutes.get('/my', authMiddleware, hiringController.getMyHiringRequests);

// ============================================
// RUTAS DE COLABORACIONES (antes de /:id)
// ============================================

/**
 * GET /api/v1/hiring/collaborations
 * Obtener todas las colaboraciones activas
 */
hiringRoutes.get('/collaborations', collaborationsController.getAllCollaborations);

/**
 * GET /api/v1/hiring/collaborations/my
 * Obtener mis colaboraciones (requiere auth)
 */
hiringRoutes.get('/collaborations/my', authMiddleware, collaborationsController.getMyCollaborations);

/**
 * POST /api/v1/hiring/collaborations
 * Crear nueva colaboración (requiere auth)
 */
hiringRoutes.post('/collaborations', authMiddleware, collaborationsController.createCollaboration);

/**
 * PUT /api/v1/hiring/collaborations/:id
 * Actualizar colaboración (requiere auth)
 */
hiringRoutes.put('/collaborations/:id', authMiddleware, collaborationsController.updateCollaboration);

/**
 * DELETE /api/v1/hiring/collaborations/:id
 * Eliminar colaboración (requiere auth)
 */
hiringRoutes.delete('/collaborations/:id', authMiddleware, collaborationsController.deleteCollaboration);

/**
 * POST /api/v1/hiring/collaborations/:id/respond
 * Responder a una colaboración (requiere auth)
 */
hiringRoutes.post('/collaborations/:id/respond', authMiddleware, collaborationsController.respondToCollaboration);

// ============================================
// RUTAS DE EVENTOS (antes de /:id)
// ============================================

/**
 * GET /api/v1/hiring/events
 * Obtener eventos disponibles para artistas
 */
hiringRoutes.get('/events', EventController.searchEvents);

/**
 * GET /api/v1/hiring/events/:id
 * Obtener detalle de un evento
 */
hiringRoutes.get('/events/:id', EventController.getEventById);

// ============================================
// RUTAS DE RESPUESTAS (antes de /:id)
// ============================================

/**
 * POST /api/v1/hiring/responses/:id/accept
 * Aceptar una postulación (requiere auth)
 */
hiringRoutes.post('/responses/:id/accept', authMiddleware, hiringController.acceptHiringResponse);

/**
 * POST /api/v1/hiring/responses/:id/reject
 * Rechazar una postulación (requiere auth)
 */
hiringRoutes.post('/responses/:id/reject', authMiddleware, hiringController.rejectHiringResponse);

// ============================================
// RUTAS DINÁMICAS CON :id (SIEMPRE AL FINAL)
// ============================================

/**
 * GET /api/v1/hiring/:id
 * Obtener detalle de una oferta con sus respuestas
 */
hiringRoutes.get('/:id', hiringController.getHiringRequestById);

/**
 * PUT /api/v1/hiring/:id
 * Actualizar una oferta (requiere auth)
 */
hiringRoutes.put('/:id', authMiddleware, hiringController.updateHiringRequest);

/**
 * DELETE /api/v1/hiring/:id
 * Eliminar una oferta (requiere auth)
 */
hiringRoutes.delete('/:id', authMiddleware, hiringController.deleteHiringRequest);

/**
 * POST /api/v1/hiring/:id/respond
 * Postularse a una oferta (requiere auth)
 */
hiringRoutes.post('/:id/respond', authMiddleware, hiringController.respondToHiringRequest);

/**
 * GET /api/v1/hiring/:id/responses
 * Obtener postulaciones de una oferta (requiere auth)
 */
hiringRoutes.get('/:id/responses', authMiddleware, hiringController.getHiringResponses);

export default hiringRoutes;
