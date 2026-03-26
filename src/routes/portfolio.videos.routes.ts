import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { featuredItems } from '../schema.js';
import { eq, and, ne } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { moderateUserRateLimit } from '../middleware/userRateLimit.middleware.js';

function extractYouTubeId(url: string): string | null {
  const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/;
  const m = url.match(pattern);
  return m ? m[1] : null;
}

export const portfolioVideosRoutes = Router();

// POST /videos - Agregar video/enlace
portfolioVideosRoutes.post('/', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { url, title, description, type, thumbnailUrl } = req.body;

  if (!url) throw new AppError(400, 'url es requerido', true, 'MISSING_URL');
  if (!title) throw new AppError(400, 'title es requerido', true, 'MISSING_TITLE');

  const validTypes = ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'];
  const itemType = type && validTypes.includes(type) ? type : 'other';

  let resolvedThumbnail = thumbnailUrl || null;
  if (!resolvedThumbnail && itemType === 'youtube') {
    const ytId = extractYouTubeId(url);
    if (ytId) resolvedThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  await db.update(featuredItems).set({ isFeatured: false, updatedAt: new Date() }).where(eq(featuredItems.userId, userId));

  const [newVideo] = await db
    .insert(featuredItems)
    .values({ userId, url, title, description: description || null, type: itemType, thumbnailUrl: resolvedThumbnail, isFeatured: true })
    .returning();

  logger.info(`Usuario ${userId} agregó video al portfolio`, { itemId: newVideo.id }, 'Portfolio');
  res.status(201).json({ success: true, message: 'Video agregado exitosamente y marcado como destacado', data: newVideo });
}));

// PATCH /videos/:id - Actualizar video/enlace
portfolioVideosRoutes.patch('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);
  const { title, description, thumbnailUrl } = req.body;

  if (isNaN(itemId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(featuredItems).where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');

  const [updated] = await db
    .update(featuredItems)
    .set({
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
      updatedAt: new Date(),
    })
    .where(eq(featuredItems.id, itemId))
    .returning();

  logger.info(`Usuario ${userId} actualizó video/enlace ${itemId}`, undefined, 'Portfolio');
  res.json({ success: true, message: 'Video/enlace actualizado exitosamente', data: updated });
}));

// DELETE /videos/:id - Eliminar video/enlace
portfolioVideosRoutes.delete('/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(featuredItems).where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');

  await db.delete(featuredItems).where(eq(featuredItems.id, itemId));

  logger.info(`Usuario ${userId} eliminó video/enlace ${itemId}`, undefined, 'Portfolio');
  res.json({ success: true, message: 'Video/enlace eliminado exitosamente' });
}));

// PATCH /videos/:id/feature - Marcar video como destacado
portfolioVideosRoutes.patch('/:id/feature', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) throw new AppError(400, 'ID inválido', true, 'INVALID_ID');

  const [existing] = await db.select().from(featuredItems).where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId))).limit(1);
  if (!existing) throw new AppError(404, 'Video no encontrado', true, 'NOT_FOUND');

  await db.update(featuredItems).set({ isFeatured: false, updatedAt: new Date() }).where(and(eq(featuredItems.userId, userId), ne(featuredItems.id, itemId)));

  const [updated] = await db.update(featuredItems).set({ isFeatured: true, updatedAt: new Date() }).where(eq(featuredItems.id, itemId)).returning();

  logger.info(`Usuario ${userId} marcó video ${itemId} como destacado`, undefined, 'Portfolio');
  res.json({ success: true, message: 'Video marcado como destacado', data: updated });
}));
