import { Router } from 'express';
// Page-scoped router: Perfil (Profile page)
// TODO: Wire to profile controllers and, next, a nested portfolio router
const profilePageRoutes = Router();
// GET /api/v1/pages/profile
profilePageRoutes.get('/', async (req, res) => {
    return res.json({
        page: 'profile',
        message: 'Profile page API placeholder',
        sections: ['header', 'about', 'portfolio', 'reviews'],
    });
});
export default profilePageRoutes;
