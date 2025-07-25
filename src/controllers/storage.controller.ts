import { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../config/firebase';
import { db } from '../db';
import { blogPosts } from '../schema';

const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

export const uploadBlogCoverImage = [
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
      }

      const bucketName = 'buscartpro-ecf88.firebasestorage.app';
      const bucket = storage.bucket(bucketName);
      
      // Generate a unique filename with the original extension
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `blog-covers/${uuidv4()}.${fileExtension}`;
      const file = bucket.file(fileName);

      // Upload the file
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: req.user?.id || 'anonymous',
            uploadTime: new Date().toISOString(),
          }
        },
        public: true, // Make the file publicly accessible
      });

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      res.json({ 
        success: true,
        message: 'Imagen subida exitosamente',
        imageUrl: publicUrl,
        fileName: fileName
      });

    } catch (error) {
      console.error('Error al subir la imagen:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al procesar la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
];

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de imagen no proporcionada' });
    }

    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const filePath = url.pathname.split('/').slice(3).join('/'); // Remove the /b/bucket-name/ part
    
    const bucketName = 'buscartpro-ecf88.firebasestorage.app';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(decodeURIComponent(filePath));

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'La imagen no existe' });
    }

    // Delete the file
    await file.delete();

    res.json({ 
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar la imagen',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
