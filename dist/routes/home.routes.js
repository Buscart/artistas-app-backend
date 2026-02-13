import { Router } from 'express';
// Page-scoped router: Inicio (Home)
// TODO: Wire to controllers/services that power the landing page
const homeRoutes = Router();
// GET /api/v1/pages/home
homeRoutes.get('/', async (req, res) => {
    // Placeholder: return featured artists, recent posts, and upcoming events
    return res.json({
        page: 'home',
        message: 'Home page API placeholder',
        sections: ['hero', 'featured_artists', 'recent_posts', 'upcoming_events'],
    });
});
export default homeRoutes;
