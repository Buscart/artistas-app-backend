import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { gallery, featuredItems, users } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { readUserRateLimit, uploadRateLimit } from '../middleware/userRateLimit.middleware.js';
import { portfolioPhotosRoutes } from './portfolio.photos.routes.js';
import { portfolioVideosRoutes } from './portfolio.videos.routes.js';

const portfolioRoutes = Router();

// Sub-routers
portfolioRoutes.use('/photos', portfolioPhotosRoutes);
portfolioRoutes.use('/videos', portfolioVideosRoutes);

// GET / - Portfolio completo del usuario autenticado
portfolioRoutes.get('/', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const [photos, videos] = await Promise.all([
    db.select().from(gallery).where(eq(gallery.userId, userId)).orderBy(gallery.createdAt),
    db.select().from(featuredItems).where(eq(featuredItems.userId, userId)).orderBy(featuredItems.createdAt),
  ]);
  res.json({ success: true, data: { photos, videos } });
}));

// GET /me - Alias del portfolio propio
portfolioRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const [photos, videos] = await Promise.all([
    db.select().from(gallery).where(eq(gallery.userId, userId)).orderBy(gallery.createdAt),
    db.select().from(featuredItems).where(eq(featuredItems.userId, userId)).orderBy(featuredItems.createdAt),
  ]);
  res.json({ success: true, data: { photos, videos } });
}));

// GET /user/:userId - Portfolio público de otro usuario
portfolioRoutes.get('/user/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [photos, videos] = await Promise.all([
    db.select().from(gallery).where(and(eq(gallery.userId, userId), eq(gallery.isPublic, true))).orderBy(gallery.createdAt),
    db.select().from(featuredItems).where(eq(featuredItems.userId, userId)).orderBy(featuredItems.createdAt),
  ]);
  res.json({ success: true, data: { photos, videos } });
}));

// GET /featured - Fotos destacadas del usuario autenticado
portfolioRoutes.get('/featured', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const featured = await db.select().from(gallery)
    .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)))
    .orderBy(gallery.orderPosition)
    .limit(4);
  res.json({ success: true, data: featured });
}));

// GET /user/:userId/featured - Fotos destacadas públicas de otro usuario
portfolioRoutes.get('/user/:userId/featured', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const featured = await db.select().from(gallery)
    .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true), eq(gallery.isPublic, true)))
    .orderBy(gallery.orderPosition)
    .limit(4);
  res.json({ success: true, data: featured });
}));

// GET /profile/:userId - Perfil público con portfolio + video destacado
portfolioRoutes.get('/profile/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const [[user], featuredPhotos, featuredVideo] = await Promise.all([
    db.select({
      id: users.id,
      displayName: users.displayName,
      profileImageUrl: users.profileImageUrl,
      coverImageUrl: users.coverImageUrl,
      bio: users.bio,
      userType: users.userType,
      isVerified: users.isVerified,
      profileComplete: users.profileComplete,
    }).from(users).where(eq(users.id, userId)).limit(1),

    db.select().from(gallery)
      .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true), eq(gallery.isPublic, true)))
      .orderBy(gallery.orderPosition)
      .limit(4),

    db.select().from(featuredItems)
      .where(and(eq(featuredItems.userId, userId), eq(featuredItems.isFeatured, true)))
      .limit(1),
  ]);

  if (!user) throw new AppError(404, 'Usuario no encontrado', true, 'NOT_FOUND');

  res.json({ success: true, data: { ...user, portfolio: featuredPhotos, featured_video: featuredVideo[0] ?? null } });
}));

// Endpoints legacy (deprecados)
portfolioRoutes.post('/services', authMiddleware, asyncHandler(async (req, res) => {
  logger.warn('Endpoint /services deprecado, usar /photos', undefined, 'Portfolio');
  const userId = req.user!.id;
  const { imageUrl, description, tags } = req.body;
  if (!imageUrl) throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
  const [newPhoto] = await db.insert(gallery).values({ userId, imageUrl, title: req.body.title || 'Servicio', description: description || null, tags: tags || [], isPublic: true, metadata: {} }).returning();
  res.status(201).json({ success: true, message: 'Foto agregada exitosamente', data: newPhoto });
}));

portfolioRoutes.post('/products', authMiddleware, asyncHandler(async (req, res) => {
  logger.warn('Endpoint /products deprecado, usar /photos', undefined, 'Portfolio');
  const userId = req.user!.id;
  const { imageUrl, description, tags, name } = req.body;
  if (!imageUrl) throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
  const [newPhoto] = await db.insert(gallery).values({ userId, imageUrl, title: name || req.body.title || 'Producto', description: description || null, tags: [...(tags || []), 'producto'], isPublic: true, metadata: {} }).returning();
  res.status(201).json({ success: true, message: 'Foto agregada exitosamente', data: newPhoto });
}));

// Retrocompatibilidad: set-featured-photos (redirige al nuevo endpoint)
portfolioRoutes.patch('/set-featured-photos', authMiddleware, asyncHandler(async (req, res) => {
  req.url = '/photos/set-featured';
  portfolioPhotosRoutes.handle(req, res, () => {});
}));

export default portfolioRoutes;
