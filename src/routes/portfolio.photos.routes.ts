import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { gallery, users } from '../schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { moderateUserRateLimit, uploadRateLimit, readUserRateLimit } from '../middleware/userRateLimit.middleware.js';

async function syncProfileComplete(userId: string): Promise<boolean> {
  const featuredPhotos = await db.select({ id: gallery.id })
    .from(gallery)
    .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)))
    .limit(5);
  const isComplete = featuredPhotos.length >= 4;
  await db.update(users).set({ profileComplete: isComplete, updatedAt: new Date() }).where(eq(users.id, userId));
  return isComplete;
}

export const portfolioPhotosRoutes = Router();

// POST /photos - Agregar foto
portfolioPhotosRoutes.post('/', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { imageUrl, title, description, tags, isPublic } = req.body;

  if (!imageUrl) throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');

  const [newPhoto] = await db
    .insert(gallery)
    .values({ userId, imageUrl, title: title || null, description: description || null, tags: tags || [], isPublic: isPublic !== undefined ? isPublic : true, metadata: {} })
    .returning();

  logger.info(`Usuario ${userId} agregó foto al portfolio`, { photoId: newPhoto.id }, 'Portfolio');
  res.status(201).json({ success: true, message: 'Foto agregada exitosamente', data: newPhoto });
}));

// PATCH /photos/:id - Actualizar foto
portfolioPhotosRoutes.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);
  const { title, description, tags, isPublic } = req.body;

  if (isNaN(photoId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(gallery).where(and(eq(gallery.id, photoId), eq(gallery.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');

  const [updated] = await db
    .update(gallery)
    .set({
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      tags: tags !== undefined ? tags : existing.tags,
      isPublic: isPublic !== undefined ? isPublic : existing.isPublic,
      updatedAt: new Date(),
    })
    .where(eq(gallery.id, photoId))
    .returning();

  logger.info(`Usuario ${userId} actualizó foto ${photoId}`, undefined, 'Portfolio');
  res.json({ success: true, message: 'Foto actualizada exitosamente', data: updated });
}));

// DELETE /photos/:id - Eliminar foto
portfolioPhotosRoutes.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);

  if (isNaN(photoId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(gallery).where(and(eq(gallery.id, photoId), eq(gallery.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');

  await db.delete(gallery).where(eq(gallery.id, photoId));

  logger.info(`Usuario ${userId} eliminó foto ${photoId}`, undefined, 'Portfolio');
  res.json({ success: true, message: 'Foto eliminada exitosamente' });
}));

// PATCH /photos/:id/featured - Marcar/desmarcar como destacado
portfolioPhotosRoutes.patch('/:id/featured', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);
  const { isFeatured, orderPosition } = req.body;

  if (isNaN(photoId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(gallery).where(and(eq(gallery.id, photoId), eq(gallery.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');

  if (isFeatured === true) {
    const currentFeatured = await db.select().from(gallery).where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)));
    if (currentFeatured.length >= 4 && !existing.isFeatured) {
      throw new AppError(400, 'Solo puedes tener 4 trabajos destacados', true, 'MAX_FEATURED_REACHED');
    }
  }

  const [updated] = await db
    .update(gallery)
    .set({
      isFeatured: isFeatured !== undefined ? isFeatured : existing.isFeatured,
      orderPosition: orderPosition !== undefined ? orderPosition : existing.orderPosition,
      updatedAt: new Date(),
    })
    .where(eq(gallery.id, photoId))
    .returning();

  logger.info(`Usuario ${userId} actualizó estado destacado de foto ${photoId}`, { isFeatured }, 'Portfolio');
  res.json({ success: true, message: 'Estado actualizado exitosamente', data: updated });
}));

// PATCH /set-featured-photos - Marcar exactamente 4 fotos como destacadas
portfolioPhotosRoutes.patch('/set-featured', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { photoIds } = req.body;

  if (!Array.isArray(photoIds) || photoIds.length !== 4) {
    throw new AppError(400, 'Se requieren exactamente 4 IDs de fotos', true, 'INVALID_PHOTO_IDS');
  }

  const ids = photoIds.map((id: unknown) => Number(id));
  if (ids.some(isNaN)) throw new AppError(400, 'Todos los IDs deben ser números enteros', true, 'INVALID_PHOTO_IDS');

  const owned = await db.select({ id: gallery.id }).from(gallery).where(and(eq(gallery.userId, userId), inArray(gallery.id, ids)));
  if (owned.length !== 4) throw new AppError(403, 'Algunas fotos no te pertenecen o no existen', true, 'FORBIDDEN');

  await db.update(gallery).set({ isFeatured: false, updatedAt: new Date() }).where(eq(gallery.userId, userId));
  await db.update(gallery).set({ isFeatured: true, updatedAt: new Date() }).where(and(eq(gallery.userId, userId), inArray(gallery.id, ids)));

  const profileComplete = await syncProfileComplete(userId);

  logger.info(`Usuario ${userId} actualizó 4 fotos destacadas`, { ids }, 'Portfolio');
  res.json({ success: true, message: 'Fotos destacadas actualizadas', data: { profileComplete } });
}));

// GET /featured - Fotos destacadas del usuario autenticado
portfolioPhotosRoutes.get('/featured', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const featured = await db.select().from(gallery)
    .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)))
    .orderBy(gallery.orderPosition)
    .limit(4);
  res.json({ success: true, data: featured });
}));
