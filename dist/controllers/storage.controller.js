import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile, deleteFile, getPublicUrl } from '../config/supabase.js';
const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});
/**
 * Sube una imagen de portada para un blog
 */
export const uploadBlogCoverImage = [
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
            }
            // Configuración del bucket y nombre del archivo
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'blog-covers';
            const fileExtension = req.file.originalname.split('.').pop();
            const fileName = `blog-covers/${uuidv4()}.${fileExtension}`;
            // Subir el archivo a Supabase Storage
            const { data: uploadData, error } = await uploadFile(bucketName, fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
            });
            if (error) {
                throw error;
            }
            if (!uploadData) {
                throw new Error('No se recibieron datos de la subida del archivo');
            }
            // Obtener la URL pública del archivo
            const publicUrl = getPublicUrl(bucketName, uploadData.path);
            res.json({
                success: true,
                message: 'Imagen subida exitosamente',
                imageUrl: publicUrl,
                fileName: fileName
            });
        }
        catch (error) {
            console.error('Error al subir la imagen:', error);
            res.status(500).json({
                success: false,
                error: 'Error al procesar la imagen',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
];
/**
 * Elimina una imagen del almacenamiento
 */
export const deleteImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ error: 'URL de imagen no proporcionada' });
        }
        // Extraer el nombre del bucket y la ruta del archivo de la URL
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        // El formato de URL de Supabase es: /storage/v1/object/public/bucket-name/file-path
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'blog-covers';
        const filePath = pathParts.slice(6).join('/'); // Eliminar /storage/v1/object/public/bucket-name/
        // Eliminar el archivo
        const { error } = await deleteFile(bucketName, filePath);
        if (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: 'La imagen no existe' });
            }
            throw error;
        }
        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente'
        });
    }
    catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la imagen',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
