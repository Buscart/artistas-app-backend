import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

// Importar controladores de artista
import { 
  getFeatured as getFeaturedArtists, 
  getAll as getAllArtists, 
  getById as getArtistById 
} from '../controllers/artist.controller.js';

// Importar controladores de eventos
import EventController, { getUpcomingEvents } from '../controllers/event.controller.js';

// Importar controladores del blog
import { getRecentPosts as getBlogRecentPosts } from '../controllers/blog.controller.js';

// Importar controladores de usuario
import { userController } from '../controllers/user.controller.js';

// Importar controladores de elementos destacados
import * as featuredController from '../controllers/featured.controller.js';

// Importar controladores de ofertas
import { offerController } from '../controllers/offer.controller.js';

// Importar controladores de perfiles
import { profileController } from '../controllers/profile.controller.js';

// Importar rutas de posts
import postRoutes from './posts.routes.js';

// Importar rutas de elementos guardados
import savedItemsRoutes from './saved-items.routes.js';

// Importar rutas
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import offerRoutes from './offer.routes.js';
import homeRoutes from './home.routes.js';
import explorerRoutes from './explorer.routes.js';
import hiringRoutes from './hiring.routes.js';
import profilePageRoutes from './profile-page.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import { storage } from '../storage/index.js';

// Crear el enrutador
const router = Router();

// Extender el tipo RequestHandler para incluir los parámetros de ruta
type RouteHandler<T = any> = RequestHandler<Record<string, string>, any, T>;

// No hay rutas de prueba en producción

// Auth routes
router.use('/auth', authRoutes);

// API v1 routes
const v1 = Router();

// Rutas públicas
router.get('/v1/artists/featured', getFeaturedArtists);
router.get('/v1/artists', getAllArtists);
router.get('/v1/artists/:id', getArtistById);
router.get('/v1/events', getUpcomingEvents);
router.get('/v1/blog', getBlogRecentPosts);
// Listado de categorías
router.get('/v1/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (e) {
    console.error('Error fetching categories:', e);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

// Rutas protegidas (requieren autenticación)
const protectedRoutes = Router();
protectedRoutes.use(authMiddleware);

// Rutas de elementos destacados
v1.get('/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.get('/users/:userId/featured', featuredController.getUserFeaturedItems as RouteHandler);
v1.post('/featured', featuredController.createFeaturedItem as RouteHandler);
v1.put('/featured/:id', featuredController.updateFeaturedItem as RouteHandler);
v1.delete('/featured/:id', featuredController.deleteFeaturedItem as RouteHandler);

// Rutas de perfil (públicas eliminadas; usar protectedRoutes más abajo)

// Rutas de posts
v1.use('/posts', postRoutes);

// Rutas por páginas (estructura limpia por secciones de la app)
const pages = Router();
pages.use('/home', homeRoutes);
pages.use('/explorer', explorerRoutes);
pages.use('/hiring', hiringRoutes);
pages.use('/profile', profilePageRoutes);
v1.use('/pages', pages);

// Rutas de portafolio (perfil -> portfolio) protegidas
v1.use('/portfolio', authMiddleware, portfolioRoutes);

// Rutas de eventos
v1.post('/events', EventController.createEvent as RouteHandler);
v1.put('/events/:id', EventController.updateEvent as RouteHandler);
v1.post('/events/:id/cancel', EventController.cancelEvent as RouteHandler);
v1.get('/events/search', EventController.searchEvents as RouteHandler);

// Rutas de perfil protegidas
protectedRoutes.get('/profile', userController.getProfile as RouteHandler);
protectedRoutes.put('/profile', userController.updateProfile as RouteHandler);
protectedRoutes.patch('/profile/type', userController.updateUserType as RouteHandler);

// Rutas de artista (perfil del artista del usuario autenticado)
protectedRoutes.get('/artist/me', (async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const artists = await storage.getArtists({ userId });
    const first = artists[0];
    // Estructura: { artist, user, category }
    return res.json(first || null);
  } catch (e) {
    console.error('Error fetching my artist profile:', e);
    return res.status(500).json({ message: 'Error al obtener el perfil de artista' });
  }
}) as RouteHandler);

protectedRoutes.put('/artist/me', (async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const {
      artistName,
      categoryId,
      subcategories,
      tags,
      description,
      availability,
      isAvailable,
      stageName,
      gallery,
    } = req.body || {};

    // Saneamiento de inputs
    const safeCategoryId = (() => {
      if (typeof categoryId === 'number') {
        return Number.isFinite(categoryId) ? categoryId : undefined;
      }
      if (typeof categoryId === 'string') {
        const trimmed = categoryId.trim();
        if (!trimmed) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    })();

    const safeGallery = Array.isArray(gallery)
      ? gallery
          .map((g: any) => (typeof g === 'string' ? g : (g?.url || g?.src)))
          .filter((v: any) => typeof v === 'string' && v.length > 0)
      : undefined;

    // Buscar artista existente por userId
    const found = await storage.getArtists({ userId });
    const existing = found[0];

    // Normalizar payload parcial permitido
    const artistPayload: Partial<typeof import('../schema.js').artists.$inferInsert> = {
      artistName,
      stageName,
      categoryId: safeCategoryId,
      subcategories: Array.isArray(subcategories) ? subcategories : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      description: typeof description === 'string' ? description : undefined,
      availability: availability && typeof availability === 'object' ? availability : undefined,
      isAvailable: typeof isAvailable === 'boolean' ? isAvailable : undefined,
      gallery: safeGallery,
    };

    // Crear si no existe
    if (!existing) {
      const created = await storage.createArtist({
        userId,
        artistName: artistPayload.artistName || 'Sin título',
        categoryId: artistPayload.categoryId ?? null,
        // Campos adicionales opcionales
        description: artistPayload.description,
        subcategories: artistPayload.subcategories as any,
        tags: artistPayload.tags as any,
        availability: artistPayload.availability as any,
        isAvailable: artistPayload.isAvailable as any,
        stageName: artistPayload.stageName as any,
        gallery: artistPayload.gallery as any,
      } as any);
      return res.json(created);
    }

    // Actualizar si existe
    const updated = await storage.updateArtist(existing.id, artistPayload as any);
    return res.json(updated);
  } catch (e) {
    console.error('Error updating my artist profile:', e);
    return res.status(500).json({ message: 'Error al actualizar el perfil de artista' });
  }
}) as RouteHandler);

// Rutas de ofertas
v1.post('/offers', offerController.create as RouteHandler);
v1.get('/offers', offerController.getAll as RouteHandler);
v1.get('/offers/:id', offerController.getById as RouteHandler);
v1.patch('/offers/:id/status', offerController.updateStatus as RouteHandler);

// Rutas de perfiles
v1.get('/profiles', profileController.getAll as RouteHandler);
v1.get('/profiles/:id', profileController.getById as RouteHandler);
v1.get('/profiles/:id/reviews', profileController.getReviews as RouteHandler);

// Montar rutas protegidas en v1
v1.use(protectedRoutes);

// Rutas públicas de usuario (después de las protegidas para evitar conflictos)
v1.get('/users/:userId', userController.getPublicProfile as RouteHandler);

// Usar rutas de la API v1 con prefijo /api/v1 (único punto de entrada)
router.use('/v1', v1);

export default router;
