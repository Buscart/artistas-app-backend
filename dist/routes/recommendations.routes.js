import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getSuggestedUsers, getTrendingUsers, getSimilarUsers, createRecommendation, getRecommendations, getRecommendationById, getMyRecommendations, deleteRecommendation, } from '../controllers/recommendations.controller.js';
const router = Router();
// ============ SUGERENCIAS DE USUARIOS ============
/**
 * GET /api/v1/recommendations/suggestions
 * Obtener sugerencias personalizadas de usuarios para seguir
 */
router.get('/suggestions', authMiddleware, getSuggestedUsers);
/**
 * GET /api/v1/recommendations/trending
 * Obtener usuarios trending (populares en crecimiento)
 */
router.get('/trending', getTrendingUsers);
/**
 * GET /api/v1/recommendations/similar
 * Obtener usuarios similares basados en intereses
 */
router.get('/similar', authMiddleware, getSimilarUsers);
// ============ RECOMENDACIONES (REVIEWS/TESTIMONIOS) ============
/**
 * GET /api/v1/recommendations/my
 * Obtener mis recomendaciones creadas
 */
router.get('/my', authMiddleware, getMyRecommendations);
/**
 * POST /api/v1/recommendations
 * Crear una nueva recomendación
 */
router.post('/', authMiddleware, createRecommendation);
/**
 * GET /api/v1/recommendations/:id
 * Obtener una recomendación específica por ID
 */
router.get('/:id', getRecommendationById);
/**
 * GET /api/v1/recommendations
 * Obtener lista de recomendaciones (con filtros opcionales)
 * Query params: type, userId, limit, offset
 */
router.get('/', getRecommendations);
/**
 * DELETE /api/v1/recommendations/:id
 * Eliminar una recomendación (solo el autor)
 */
router.delete('/:id', authMiddleware, deleteRecommendation);
export default router;
