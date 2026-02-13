import { Router } from 'express';
import { artistsController } from '../controllers/artists.controller.js';
const router = Router();
// Get artists for map (with coordinates)
router.get('/map', artistsController.getArtistsForMap);
// Get artists with filters
router.get('/', artistsController.getArtistsByFilters);
// Get artist by ID
router.get('/:id', artistsController.getArtistById);
export default router;
