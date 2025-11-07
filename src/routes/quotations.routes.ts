import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as quotationsController from '../controllers/quotations.controller.js';

const router = Router();

// Todas las rutas de cotizaciones requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/v1/quotations/my
 * Obtener mis solicitudes de cotización (como cliente)
 */
router.get('/my', quotationsController.getMyQuotations);

/**
 * GET /api/v1/quotations/received
 * Obtener cotizaciones recibidas (como artista)
 */
router.get('/received', quotationsController.getReceivedQuotations);

/**
 * GET /api/v1/quotations/:id
 * Obtener una cotización específica por ID
 */
router.get('/:id', quotationsController.getQuotationById);

/**
 * POST /api/v1/quotations
 * Crear nueva solicitud de cotización
 */
router.post('/', quotationsController.createQuotation);

/**
 * POST /api/v1/quotations/:id/respond
 * Responder a una cotización (solo artista)
 */
router.post('/:id/respond', quotationsController.respondToQuotation);

/**
 * POST /api/v1/quotations/:id/accept
 * Aceptar una cotización (solo cliente)
 */
router.post('/:id/accept', quotationsController.acceptQuotation);

/**
 * PATCH /api/v1/quotations/:id/status
 * Actualizar estado de cotización
 */
router.patch('/:id/status', quotationsController.updateQuotationStatus);

export default router;
