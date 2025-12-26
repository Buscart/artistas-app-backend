import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { uploadRateLimit } from '../middleware/userRateLimit.middleware.js';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const uploadRoutes = Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato no soportado: ${file.mimetype}. Usa JPG, PNG, GIF o WebP.`));
    }
  }
});

// Crear cliente de Supabase con service role (bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/v1/upload/image
 * Sube una imagen a Supabase Storage
 */
uploadRoutes.post('/image',
  authMiddleware,
  uploadRateLimit,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó ningún archivo', true, 'NO_FILE');
    }

    const { bucket = 'posts', path = '' } = req.body;

    // Generar nombre único para el archivo
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    console.log('📤 Subiendo archivo al backend:', {
      fileName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bucket,
      path: filePath
    });

    // Subir archivo a Supabase usando service role
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo a Supabase:', error);
      throw new AppError(500, `Error al subir imagen: ${error.message}`, true, 'UPLOAD_ERROR');
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('✅ Archivo subido exitosamente:', publicUrl);

    res.json({
      success: true,
      fileName: req.file.originalname,
      downloadURL: publicUrl,
      path: filePath
    });
  })
);

/**
 * POST /api/v1/upload/images (múltiples imágenes)
 * Sube múltiples imágenes a Supabase Storage
 */
uploadRoutes.post('/images',
  authMiddleware,
  uploadRateLimit,
  upload.array('files', 10), // Máximo 10 archivos
  asyncHandler(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError(400, 'No se proporcionaron archivos', true, 'NO_FILES');
    }

    const { bucket = 'posts', path = '' } = req.body;

    console.log(`📤 Subiendo ${req.files.length} archivos al backend`);

    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`❌ Error subiendo ${file.originalname}:`, error);
        return {
          success: false,
          fileName: file.originalname,
          error: error.message
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        fileName: file.originalname,
        downloadURL: publicUrl,
        path: filePath
      };
    });

    const results = await Promise.all(uploadPromises);

    console.log(`✅ ${results.filter(r => r.success).length}/${req.files.length} archivos subidos`);

    res.json({
      success: true,
      results
    });
  })
);

export default uploadRoutes;
