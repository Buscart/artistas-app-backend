import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { db } from '../db.js';
import { gallery, featuredItems, users } from '../schema.js';
import { eq, and, inArray, ne } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  readUserRateLimit,
  moderateUserRateLimit,
  uploadRateLimit
} from '../middleware/userRateLimit.middleware.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extrae el ID de un video de YouTube desde distintos formatos de URL.
 * Soporta: watch?v=, youtu.be/, shorts/, embed/
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Recalcula y persiste profile_complete para el usuario:
 * true si tiene exactamente 4 fotos marcadas como is_featured.
 */
async function syncProfileComplete(userId: string): Promise<boolean> {
  const featuredPhotos = await db.select({ id: gallery.id })
    .from(gallery)
    .where(and(eq(gallery.userId, userId), eq(gallery.isFeatured, true)))
    .limit(5);

  const isComplete = featuredPhotos.length >= 4;

  await db.update(users)
    .set({ profileComplete: isComplete, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return isComplete;
}

const portfolioRoutes = Router();

/**
 * @swagger
 * /api/v1/portfolio:
 *   get:
 *     summary: Obtener portfolio completo
 *     description: Obtiene todas las fotos y videos del portfolio del usuario autenticado
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GalleryItem'
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeaturedItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// GET /api/v1/portfolio - Obtener todo el portfolio del usuario
portfolioRoutes.get('/', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const [photos, videos] = await Promise.all([
    // Gallery items (fotos)
    db.select()
      .from(gallery)
      .where(eq(gallery.userId, userId))
      .orderBy(gallery.createdAt),

    // Featured items (videos, enlaces)
    db.select()
      .from(featuredItems)
      .where(eq(featuredItems.userId, userId))
      .orderBy(featuredItems.createdAt),
  ]);

  res.json({
    success: true,
    data: {
      photos,
      videos,
    },
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/photos:
 *   post:
 *     summary: Agregar foto al portfolio
 *     description: Agrega una nueva foto a la galería del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 example: "https://storage.supabase.co/image.jpg"
 *               title:
 *                 type: string
 *                 example: "Mi obra de arte"
 *               description:
 *                 type: string
 *                 example: "Descripción de la imagen"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["arte", "portfolio"]
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Foto agregada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/GalleryItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/v1/portfolio/photos - Agregar foto a galería
portfolioRoutes.post('/photos', authMiddleware, uploadRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { imageUrl, title, description, tags, isPublic } = req.body;

  if (!imageUrl) {
    throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
  }

  const [newPhoto] = await db
    .insert(gallery)
    .values({
      userId,
      imageUrl,
      title: title || null,
      description: description || null,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      metadata: {},
    })
    .returning();

  logger.info(`Usuario ${userId} agregó foto al portfolio`, { photoId: newPhoto.id }, 'Portfolio');

  res.status(201).json({
    success: true,
    message: 'Foto agregada exitosamente',
    data: newPhoto,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/photos/{id}:
 *   patch:
 *     summary: Actualizar foto del portfolio
 *     description: Actualiza los datos de una foto existente en la galería
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la foto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Foto actualizada exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PATCH /api/v1/portfolio/photos/:id - Actualizar foto
portfolioRoutes.patch('/photos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);
  const { title, description, tags, isPublic } = req.body;

  if (isNaN(photoId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db
    .select()
    .from(gallery)
    .where(and(
      eq(gallery.id, photoId),
      eq(gallery.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
  }

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

  res.json({
    success: true,
    message: 'Foto actualizada exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/photos/{id}:
 *   delete:
 *     summary: Eliminar foto del portfolio
 *     description: Elimina una foto de la galería del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la foto
 *     responses:
 *       200:
 *         description: Foto eliminada exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/v1/portfolio/photos/:id - Eliminar foto
portfolioRoutes.delete('/photos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);

  if (isNaN(photoId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db
    .select()
    .from(gallery)
    .where(and(
      eq(gallery.id, photoId),
      eq(gallery.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
  }

  await db.delete(gallery).where(eq(gallery.id, photoId));

  logger.info(`Usuario ${userId} eliminó foto ${photoId}`, undefined, 'Portfolio');

  res.json({
    success: true,
    message: 'Foto eliminada exitosamente',
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/videos:
 *   post:
 *     summary: Agregar video/enlace al portfolio
 *     description: Agrega un nuevo video o enlace destacado al portfolio
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - title
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://youtube.com/watch?v=abc123"
 *               title:
 *                 type: string
 *                 example: "Mi video destacado"
 *               description:
 *                 type: string
 *                 example: "Descripción del video"
 *               type:
 *                 type: string
 *                 enum: [youtube, spotify, vimeo, soundcloud, other]
 *                 example: "youtube"
 *               thumbnailUrl:
 *                 type: string
 *                 example: "https://example.com/thumb.jpg"
 *     responses:
 *       201:
 *         description: Video/enlace agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FeaturedItem'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
// POST /api/v1/portfolio/videos - Agregar video/enlace destacado
// Auto-extrae thumbnail de YouTube. Marca el nuevo video como is_featured=true
// y desactiva is_featured de todos los videos anteriores del mismo usuario.
portfolioRoutes.post('/videos', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { url, title, description, type, thumbnailUrl } = req.body;

  if (!url) {
    throw new AppError(400, 'url es requerido', true, 'MISSING_URL');
  }

  if (!title) {
    throw new AppError(400, 'title es requerido', true, 'MISSING_TITLE');
  }

  const validTypes = ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'];
  const itemType = type && validTypes.includes(type) ? type : 'other';

  // Auto-extraer thumbnail de YouTube si no se proveyó
  let resolvedThumbnail = thumbnailUrl || null;
  if (!resolvedThumbnail && itemType === 'youtube') {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      resolvedThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }

  // Desactivar is_featured de todos los videos anteriores del usuario
  await db.update(featuredItems)
    .set({ isFeatured: false, updatedAt: new Date() })
    .where(eq(featuredItems.userId, userId));

  // Insertar nuevo video como el destacado
  const [newVideo] = await db
    .insert(featuredItems)
    .values({
      userId,
      url,
      title,
      description: description || null,
      type: itemType,
      thumbnailUrl: resolvedThumbnail,
      isFeatured: true,
    })
    .returning();

  logger.info(`Usuario ${userId} agregó video al portfolio (auto-featured)`, { itemId: newVideo.id }, 'Portfolio');

  res.status(201).json({
    success: true,
    message: 'Video agregado exitosamente y marcado como destacado',
    data: newVideo,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/videos/{id}:
 *   patch:
 *     summary: Actualizar video/enlace del portfolio
 *     description: Actualiza los datos de un video o enlace existente
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del video/enlace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video/enlace actualizado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// PATCH /api/v1/portfolio/videos/:id - Actualizar video/enlace
portfolioRoutes.patch('/videos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);
  const { title, description, thumbnailUrl } = req.body;

  if (isNaN(itemId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db
    .select()
    .from(featuredItems)
    .where(and(
      eq(featuredItems.id, itemId),
      eq(featuredItems.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');
  }

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

  res.json({
    success: true,
    message: 'Video/enlace actualizado exitosamente',
    data: updated,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/videos/{id}:
 *   delete:
 *     summary: Eliminar video/enlace del portfolio
 *     description: Elimina un video o enlace del portfolio del usuario
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del video/enlace
 *     responses:
 *       200:
 *         description: Video/enlace eliminado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// DELETE /api/v1/portfolio/videos/:id - Eliminar video/enlace
portfolioRoutes.delete('/videos/:id', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db
    .select()
    .from(featuredItems)
    .where(and(
      eq(featuredItems.id, itemId),
      eq(featuredItems.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Video/enlace no encontrado', true, 'NOT_FOUND');
  }

  await db.delete(featuredItems).where(eq(featuredItems.id, itemId));

  logger.info(`Usuario ${userId} eliminó video/enlace ${itemId}`, undefined, 'Portfolio');

  res.json({
    success: true,
    message: 'Video/enlace eliminado exitosamente',
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/featured:
 *   get:
 *     summary: Obtener trabajos destacados
 *     description: Obtiene las fotos marcadas como destacadas del portfolio del usuario (máximo 4)
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trabajos destacados obtenidos exitosamente
 */
// GET /api/v1/portfolio/featured - Obtener trabajos destacados del usuario autenticado
portfolioRoutes.get('/featured', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const featured = await db.select()
    .from(gallery)
    .where(and(
      eq(gallery.userId, userId),
      eq(gallery.isFeatured, true)
    ))
    .orderBy(gallery.orderPosition)
    .limit(4);

  res.json({
    success: true,
    data: featured,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/user/{userId}:
 *   get:
 *     summary: Obtener portfolio público de un usuario
 *     description: Obtiene el portfolio público de cualquier usuario (solo fotos públicas)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Portfolio obtenido exitosamente
 */
// GET /api/v1/portfolio/user/:userId - Obtener portfolio público de otro usuario
portfolioRoutes.get('/user/:userId', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [photos, videos] = await Promise.all([
    db.select()
      .from(gallery)
      .where(and(
        eq(gallery.userId, userId),
        eq(gallery.isPublic, true)
      ))
      .orderBy(gallery.createdAt),

    db.select()
      .from(featuredItems)
      .where(eq(featuredItems.userId, userId))
      .orderBy(featuredItems.createdAt),
  ]);

  res.json({
    success: true,
    data: {
      photos,
      videos,
    },
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/user/{userId}/featured:
 *   get:
 *     summary: Obtener trabajos destacados de un usuario
 *     description: Obtiene las fotos destacadas públicas de cualquier usuario (máximo 4)
 *     tags: [Portfolio]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trabajos destacados obtenidos exitosamente
 */
// GET /api/v1/portfolio/user/:userId/featured - Obtener trabajos destacados de otro usuario
portfolioRoutes.get('/user/:userId/featured', readUserRateLimit, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const featured = await db.select()
    .from(gallery)
    .where(and(
      eq(gallery.userId, userId),
      eq(gallery.isFeatured, true),
      eq(gallery.isPublic, true)
    ))
    .orderBy(gallery.orderPosition)
    .limit(4);

  res.json({
    success: true,
    data: featured,
  });
}));

/**
 * @swagger
 * /api/v1/portfolio/photos/{id}/featured:
 *   patch:
 *     summary: Marcar/desmarcar foto como destacada
 *     description: Actualiza el estado de destacado de una foto. Solo se permiten hasta 4 fotos destacadas.
 *     tags: [Portfolio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFeatured:
 *                 type: boolean
 *               orderPosition:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
// PATCH /api/v1/portfolio/photos/:id/featured - Marcar/desmarcar como destacado
portfolioRoutes.patch('/photos/:id/featured', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const photoId = parseInt(req.params.id);
  const { isFeatured, orderPosition } = req.body;

  if (isNaN(photoId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db
    .select()
    .from(gallery)
    .where(and(
      eq(gallery.id, photoId),
      eq(gallery.userId, userId)
    ))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Foto no encontrada', true, 'NOT_FOUND');
  }

  // Si se está marcando como destacado, verificar límite de 4
  if (isFeatured === true) {
    const currentFeatured = await db.select()
      .from(gallery)
      .where(and(
        eq(gallery.userId, userId),
        eq(gallery.isFeatured, true)
      ));

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

  res.json({
    success: true,
    message: 'Estado actualizado exitosamente',
    data: updated,
  });
}));

// Mantener endpoints legacy para compatibilidad con frontend existente
// Estos se pueden deprecar eventualmente

// POST /api/v1/portfolio/services - Deprecado, usar /photos
portfolioRoutes.post('/services', authMiddleware, asyncHandler(async (req, res) => {
  logger.warn('Endpoint /services deprecado, usar /photos', undefined, 'Portfolio');
  const userId = req.user!.id;
  const { imageUrl, description, tags } = req.body;

  if (!imageUrl) {
    throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
  }

  const [newPhoto] = await db
    .insert(gallery)
    .values({
      userId,
      imageUrl,
      title: req.body.title || 'Servicio',
      description: description || null,
      tags: tags || [],
      isPublic: true,
      metadata: {},
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Foto agregada exitosamente',
    data: newPhoto,
  });
}));

// POST /api/v1/portfolio/products - Deprecado, usar /photos con tags
portfolioRoutes.post('/products', authMiddleware, asyncHandler(async (req, res) => {
  logger.warn('Endpoint /products deprecado, usar /photos', undefined, 'Portfolio');
  const userId = req.user!.id;
  const { imageUrl, description, tags, name } = req.body;

  if (!imageUrl) {
    throw new AppError(400, 'imageUrl es requerido', true, 'MISSING_IMAGE_URL');
  }

  const [newPhoto] = await db
    .insert(gallery)
    .values({
      userId,
      imageUrl,
      title: name || req.body.title || 'Producto',
      description: description || null,
      tags: [...(tags || []), 'producto'],
      isPublic: true,
      metadata: {},
    })
    .returning();

  res.status(201).json({
    success: true,
    message: 'Foto agregada exitosamente',
    data: newPhoto,
  });
}));

// GET /api/v1/portfolio/me - Alias para obtener portfolio del usuario autenticado
portfolioRoutes.get('/me', authMiddleware, readUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const [photos, videos] = await Promise.all([
    // Gallery items (fotos)
    db.select()
      .from(gallery)
      .where(eq(gallery.userId, userId))
      .orderBy(gallery.createdAt),

    // Featured items (videos, enlaces)
    db.select()
      .from(featuredItems)
      .where(eq(featuredItems.userId, userId))
      .orderBy(featuredItems.createdAt),
  ]);

  res.json({
    success: true,
    data: {
      photos,
      videos,
    },
  });
}));

// ── NUEVOS ENDPOINTS ────────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/portfolio/set-featured-photos
 * Body: { photoIds: number[] }  — exactamente 4 IDs de fotos propias
 *
 * Marca los 4 IDs recibidos como is_featured=true.
 * Pone is_featured=false en todas las demás fotos del usuario.
 * Luego recalcula profile_complete.
 */
portfolioRoutes.patch('/set-featured-photos', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { photoIds } = req.body;

  if (!Array.isArray(photoIds) || photoIds.length !== 4) {
    throw new AppError(400, 'Se requieren exactamente 4 IDs de fotos', true, 'INVALID_PHOTO_IDS');
  }

  const ids = photoIds.map((id: unknown) => Number(id));
  if (ids.some(isNaN)) {
    throw new AppError(400, 'Todos los IDs deben ser números enteros', true, 'INVALID_PHOTO_IDS');
  }

  // Verificar que todas las fotos pertenecen al usuario
  const owned = await db.select({ id: gallery.id })
    .from(gallery)
    .where(and(eq(gallery.userId, userId), inArray(gallery.id, ids)));

  if (owned.length !== 4) {
    throw new AppError(403, 'Algunas fotos no te pertenecen o no existen', true, 'FORBIDDEN');
  }

  // Desmarcar todas las fotos del usuario
  await db.update(gallery)
    .set({ isFeatured: false, updatedAt: new Date() })
    .where(eq(gallery.userId, userId));

  // Marcar las 4 seleccionadas
  await db.update(gallery)
    .set({ isFeatured: true, updatedAt: new Date() })
    .where(and(eq(gallery.userId, userId), inArray(gallery.id, ids)));

  // Actualizar profile_complete
  const profileComplete = await syncProfileComplete(userId);

  logger.info(`Usuario ${userId} actualizó 4 fotos destacadas`, { ids }, 'Portfolio');

  res.json({
    success: true,
    message: 'Fotos destacadas actualizadas',
    data: { profileComplete },
  });
}));

/**
 * PATCH /api/v1/portfolio/videos/:id/feature
 * Marca el video :id como is_featured=true y desactiva los demás.
 */
portfolioRoutes.patch('/videos/:id/feature', authMiddleware, moderateUserRateLimit, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    throw new AppError(400, 'ID inválido', true, 'INVALID_ID');
  }

  // Verificar propiedad
  const [existing] = await db.select()
    .from(featuredItems)
    .where(and(eq(featuredItems.id, itemId), eq(featuredItems.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new AppError(404, 'Video no encontrado', true, 'NOT_FOUND');
  }

  // Desactivar todos los otros
  await db.update(featuredItems)
    .set({ isFeatured: false, updatedAt: new Date() })
    .where(and(eq(featuredItems.userId, userId), ne(featuredItems.id, itemId)));

  // Activar el seleccionado
  const [updated] = await db.update(featuredItems)
    .set({ isFeatured: true, updatedAt: new Date() })
    .where(eq(featuredItems.id, itemId))
    .returning();

  logger.info(`Usuario ${userId} marcó video ${itemId} como destacado`, undefined, 'Portfolio');

  res.json({
    success: true,
    message: 'Video marcado como destacado',
    data: updated,
  });
}));

/**
 * GET /api/v1/portfolio/profile/:userId
 * Retorna el perfil público del usuario con:
 *   - portfolio: las 4 fotos marcadas como is_featured (o las disponibles)
 *   - featured_video: el único video marcado como is_featured
 *   - profile_complete: boolean
 */
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
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

    db.select()
      .from(gallery)
      .where(and(
        eq(gallery.userId, userId),
        eq(gallery.isFeatured, true),
        eq(gallery.isPublic, true),
      ))
      .orderBy(gallery.orderPosition)
      .limit(4),

    db.select()
      .from(featuredItems)
      .where(and(
        eq(featuredItems.userId, userId),
        eq(featuredItems.isFeatured, true),
      ))
      .limit(1),
  ]);

  if (!user) {
    throw new AppError(404, 'Usuario no encontrado', true, 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      ...user,
      portfolio: featuredPhotos,
      featured_video: featuredVideo[0] ?? null,
    },
  });
}));

export default portfolioRoutes;
