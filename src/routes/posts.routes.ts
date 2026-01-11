import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { PostsController } from '../controllers/posts.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { UserWithId } from '../types/user.types.js';
import multer from 'multer';
import { uploadMediaFiles } from '../services/storage.service.js';

// Extender el tipo Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;
    }
  }
}

const router = Router();

// Configurar Multer con almacenamiento en memoria (los archivos se suben a Supabase)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de archivo no permitido'));
  },
});

// Función de ayuda para obtener archivos de la solicitud
function getUploadedFiles(req: Request): Express.Multer.File[] {
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files).flat();
}

// Esquema de validación para crear un post
const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(['post', 'nota', 'blog']).default('post'),
  // Coerce string "true"/"false" to boolean for FormData compatibility
  isPublic: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    },
    z.boolean().default(true)
  ),
});

// Crear un nuevo post
router.post(
  '/',
  authMiddleware,
  memoryUpload.array('media', 10), // Permitir hasta 10 archivos
  validateRequest(createPostSchema, 'body'),
  PostsController.createPost
);

// Obtener todos los posts
router.get('/', PostsController.getPosts);

// Obtener un post por ID
router.get('/:id', PostsController.getPostById);

// Obtener posts por usuario
router.get('/user/:userId', PostsController.getUserPosts);

// Actualizar un post
router.put(
  '/:id',
  authMiddleware,
  validateRequest(createPostSchema.partial(), 'body'),
  PostsController.updatePost
);

// Eliminar un post
router.delete('/:id', authMiddleware, PostsController.deletePost);

// Añadir medios a un post existente
router.post(
  '/:id/media',
  authMiddleware,
  memoryUpload.array('media', 10),
  PostsController.addMediaToPost
);

// Dar like a un post
router.post('/:id/like', authMiddleware, PostsController.likePost);

// Quitar like de un post
router.delete('/:id/like', authMiddleware, PostsController.unlikePost);

// Compartir un post
router.post('/:id/share', authMiddleware, PostsController.sharePost);

// Obtener comentarios de un post
router.get('/:id/comments', PostsController.getComments);

// Crear comentario en un post
router.post('/:id/comments', authMiddleware, PostsController.createComment);

// Dar like a un comentario
router.post('/comments/:commentId/like', authMiddleware, PostsController.likeComment);

// Quitar like de un comentario
router.delete('/comments/:commentId/like', authMiddleware, PostsController.unlikeComment);

export default router;
