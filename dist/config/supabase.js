import { createClient } from '@supabase/supabase-js';
// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Advertencia: Usando credenciales de prueba para Supabase (modo ' + process.env.NODE_ENV + ')');
    }
    else {
        throw new Error('Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    }
}
// Crear el cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceRoleKey || 'placeholder-key', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
export { supabase };
/**
 * Obtiene el cliente de almacenamiento de Supabase
 * @returns Instancia del cliente de almacenamiento
 */
export function getStorageClient() {
    return supabase.storage;
}
/**
 * Sube un archivo a Supabase Storage
 * @param bucket Nombre del bucket
 * @param filePath Ruta donde se guardará el archivo (incluyendo el nombre del archivo)
 * @param file Contenido del archivo (Buffer, Blob, etc.)
 * @param options Opciones adicionales
 * @returns Objeto con los datos de la subida o un error
 */
export async function uploadFile(bucket, filePath, file, options = {}) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
        cacheControl: options.cacheControl || '3600',
        contentType: options.contentType || 'application/octet-stream',
        upsert: options.upsert || false,
    });
    return { data, error };
}
/**
 * Elimina un archivo de Supabase Storage
 * @param bucket Nombre del bucket
 * @param filePath Ruta del archivo a eliminar
 * @returns Resultado de la operación
 */
export async function deleteFile(bucket, filePath) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
    return { data, error };
}
/**
 * Obtiene la URL pública de un archivo
 * @param bucket Nombre del bucket
 * @param filePath Ruta del archivo
 * @returns URL pública del archivo
 */
export function getPublicUrl(bucket, filePath) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    return data.publicUrl;
}
