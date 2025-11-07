import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as hiringController from '../controllers/hiring.controller.js';

const hiringRoutes = Router();

/**
 * GET /api/v1/hiring
 * Obtener todas las ofertas de trabajo activas (público)
 */
hiringRoutes.get('/', hiringController.getAllHiringRequests);

/**
 * GET /api/v1/hiring/my
 * Obtener mis ofertas publicadas (requiere auth)
 */
hiringRoutes.get('/my', authMiddleware, hiringController.getMyHiringRequests);

/**
 * GET /api/v1/hiring/:id
 * Obtener detalle de una oferta con sus respuestas
 */
hiringRoutes.get('/:id', hiringController.getHiringRequestById);

/**
 * POST /api/v1/hiring
 * Crear nueva oferta de trabajo (requiere auth)
 */
hiringRoutes.post('/', authMiddleware, hiringController.createHiringRequest);

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

export default hiringRoutes;
