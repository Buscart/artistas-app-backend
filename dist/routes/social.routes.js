import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { SocialService } from '../services/social.service.js';
const router = Router();
// Obtener usuarios sugeridos
router.get('/users/suggested', authMiddleware, async (req, res, next) => {
    try {
        console.log('📥 GET /users/suggested - Request received');
        const userId = req.user?.id;
        const { limit = '3' } = req.query;
        console.log('👤 User ID from token:', userId);
        console.log('🔢 Requested limit:', limit);
        if (!userId) {
            console.log('❌ No user ID - returning 401');
            return res.status(401).json({ message: 'No autorizado' });
        }
        const users = await SocialService.getSuggestedUsers(userId, parseInt(limit));
        console.log('✅ Sending response with', users.length, 'users');
        res.json({ users });
    }
    catch (error) {
        console.error('❌ Error in /users/suggested endpoint:', error);
        next(error);
    }
});
// Obtener tendencias
router.get('/trending', async (req, res, next) => {
    try {
        const { limit = '4' } = req.query;
        const trends = await SocialService.getTrendingTopics(parseInt(limit));
        res.json({ trends });
    }
    catch (error) {
        next(error);
    }
});
// Seguir a un usuario
router.post('/users/:userId/follow', authMiddleware, async (req, res, next) => {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;
        if (!followerId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (followerId === userId) {
            return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
        }
        await SocialService.followUser(followerId, userId);
        res.json({ message: 'Usuario seguido correctamente' });
    }
    catch (error) {
        next(error);
    }
});
// Dejar de seguir a un usuario
router.delete('/users/:userId/follow', authMiddleware, async (req, res, next) => {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;
        if (!followerId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        await SocialService.unfollowUser(followerId, userId);
        res.json({ message: 'Usuario dejado de seguir correctamente' });
    }
    catch (error) {
        next(error);
    }
});
export default router;
