import { Router } from 'express';
import { uploadBlogCoverImage, deleteImage } from '../controllers/storage.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Ruta para subir imágenes de portada de blog
router.post('/blog/cover', authMiddleware, uploadBlogCoverImage);

// Ruta para eliminar imágenes
router.delete('/images', authMiddleware, deleteImage);

export default router;
