import { Router } from 'express';
import ExplorerController from '../controllers/explorer.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Page-scoped router: Explorar (Explorer)
const explorerRoutes = Router();

// GET /api/v1/explorer/artists - Obtener artistas
explorerRoutes.get('/artists', ExplorerController.getArtists);

// GET /api/v1/explorer/events - Obtener eventos
explorerRoutes.get('/events', ExplorerController.getEvents);

// GET /api/v1/explorer/venues - Obtener lugares
explorerRoutes.get('/venues', ExplorerController.getVenues);

// GET /api/v1/explorer/services - Obtener servicios (público)
explorerRoutes.get('/services', ExplorerController.getServices);

// Rutas protegidas de servicios (requieren auth)
explorerRoutes.get('/services/me', authMiddleware, ExplorerController.getMyServices);
explorerRoutes.post('/services', authMiddleware, ExplorerController.createService);
explorerRoutes.patch('/services/:id', authMiddleware, ExplorerController.updateService);
explorerRoutes.delete('/services/:id', authMiddleware, ExplorerController.deleteService);

// GET /api/v1/explorer/services/user/:userId - Servicios públicos de un usuario
explorerRoutes.get('/services/user/:userId', ExplorerController.getUserServicesById);

// GET /api/v1/explorer/artworks - Obtener obras de arte
explorerRoutes.get('/artworks', ExplorerController.getArtworks);

// GET /api/v1/explorer/health
explorerRoutes.get('/health', ExplorerController.healthCheck);

// DELETE /api/v1/explorer/cache (admin)
explorerRoutes.delete('/cache', ExplorerController.clearCache);

export default explorerRoutes;
