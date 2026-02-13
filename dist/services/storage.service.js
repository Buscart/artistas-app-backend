import { v4 as uuidv4 } from 'uuid';
import { uploadFile, getPublicUrl, supabase } from '../config/supabase.js';
/**
 * Sube múltiples archivos de medios a Supabase Storage
 * @param files - Archivos a subir
 * @param bucket - Bucket de destino
 * @param userId - ID del usuario propietario (para organizar por carpetas)
 */
export async function uploadMediaFiles(files, bucket, userId) {
    console.log(`📤 Uploading ${files.length} files to bucket: ${bucket}`);
    const mediaFiles = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
        const fileName = `${uuidv4()}.${ext}`;
        // Organizar por carpetas si hay userId
        const filePath = userId
            ? `${userId}/${fileName}`
            : `${fileName}`;
        console.log(`📎 Uploading file ${i + 1}/${files.length}: ${filePath} (${file.mimetype}, ${file.size} bytes)`);
        const { data, error } = await uploadFile(bucket, filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            console.error(`❌ Error uploading file to ${bucket}/${filePath}:`, error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw new Error(`Error al subir archivo: ${error.message}`);
        }
        console.log(`✅ File uploaded successfully: ${data?.path}`);
        const publicUrl = getPublicUrl(bucket, data?.path || filePath);
        mediaFiles.push({
            url: publicUrl,
            path: data?.path || filePath,
            type: file.mimetype.split('/')[0],
            thumbnailUrl: file.mimetype.startsWith('image/') ? publicUrl : null,
            order: i,
        });
    }
    console.log(`✅ All files uploaded successfully: ${mediaFiles.length} files`);
    return mediaFiles;
}
/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteMediaFile(bucket, filePath) {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
    if (error) {
        console.error(`Error deleting file from ${bucket}/${filePath}:`, error);
        throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
}
/**
 * Elimina múltiples archivos de Supabase Storage
 */
export async function deleteMediaFiles(bucket, filePaths) {
    const { error } = await supabase.storage
        .from(bucket)
        .remove(filePaths);
    if (error) {
        console.error(`Error deleting files from ${bucket}:`, error);
        throw new Error(`Error al eliminar archivos: ${error.message}`);
    }
}
/**
 * Lista archivos de un usuario en un bucket
 */
export async function listUserFiles(bucket, userId, folder) {
    const path = folder ? `${userId}/${folder}` : userId;
    const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
        console.error(`Error listing files from ${bucket}/${path}:`, error);
        throw new Error(`Error al listar archivos: ${error.message}`);
    }
    return data || [];
}
