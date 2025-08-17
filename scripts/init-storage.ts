import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Configurar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Depuración: Mostrar todas las variables de entorno (sin valores sensibles)
console.log('Variables de entorno cargadas:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));

// Obtener las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usar la clave de servicio o la clave anónima del frontend como último recurso
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mostrar las variables que estamos usando (sin mostrar la clave completa)
console.log('URL de Supabase:', supabaseUrl ? '✓ Configurada' : '✗ No configurada');
console.log('Clave de servicio de Supabase:', supabaseKey ? '✓ Configurada' : '✗ No configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Configura las variables de entorno de Supabase en el archivo .env');
  console.error('Se requieren las siguientes variables:');
  console.error('SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=sb://...');
  console.error('\nPuedes encontrar estas credenciales en la configuración de tu proyecto en Supabase:');
  console.error('1. Ve a https://app.supabase.com');
  console.error('2. Selecciona tu proyecto');
  console.error('3. Ve a Project Settings > API');
  process.exit(1);
}

// Configurar URLs de la API de Supabase
const SUPABASE_REST_URL = `${supabaseUrl}/rest/v1`;
const SUPABASE_STORAGE_URL = `${supabaseUrl}/storage/v1`;

// Función para hacer peticiones a la API de Storage
async function storageRequest(endpoint: string, method: string = 'GET', body: any = null) {
  const url = `${SUPABASE_STORAGE_URL}${endpoint}`;
  const options: any = {
    method,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Configuración de los buckets
type BucketConfig = {
  name: string;
  isPublic: boolean;
  fileSizeLimit?: number; // en MB
  allowedMimeTypes?: string[];
};

const BUCKETS: BucketConfig[] = [
  {
    name: 'posts',
    isPublic: true,
    fileSizeLimit: 10, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ],
  },
  {
    name: 'services',
    isPublic: true,
    fileSizeLimit: 20, // 20MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  {
    name: 'products',
    isPublic: true,
    fileSizeLimit: 5, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
  },
  {
    name: 'profiles',
    isPublic: true,
    fileSizeLimit: 2, // 2MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  },
  {
    name: 'documents',
    isPublic: false,
    fileSizeLimit: 50, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  },
];

// Función para crear un bucket
async function createBucket(bucket: BucketConfig) {
  try {
    console.log(`Procesando bucket: ${bucket.name}...`);
    
    // Configuración del bucket
    const bucketConfig = {
      name: bucket.name,
      public: bucket.isPublic,
      file_size_limit: bucket.fileSizeLimit ? `${bucket.fileSizeLimit}MB` : null,
      allowed_mime_types: bucket.allowedMimeTypes || null
    };
    
    // Primero intentamos crear el bucket
    const { data: createData, error: createError } = await storageRequest('/bucket', 'POST', bucketConfig);
    
    if (createError) {
      // Si el error es que el bucket ya existe, intentamos actualizarlo
      if (createError.message.includes('already exists')) {
        console.log(`El bucket ${bucket.name} ya existe. Actualizando configuración...`);
        const { error: updateError } = await storageRequest(
          `/bucket/${bucket.name}`, 
          'PUT', 
          bucketConfig
        );
        
        if (updateError) throw updateError;
        console.log(`Bucket ${bucket.name} actualizado correctamente.`);
        return;
      }
      
      // Si es otro error, lo lanzamos
      throw createError;
    }
    
    console.log(`Bucket ${bucket.name} creado correctamente.`);
    
  } catch (error) {
    console.error(`Error al procesar el bucket ${bucket.name}:`, error.message || error);
  }
}

// Función principal
async function main() {
  console.log('Iniciando configuración de buckets de almacenamiento...');
  
  try {
    // Crear cada bucket en secuencia (no en paralelo para evitar conflictos)
    for (const bucket of BUCKETS) {
      await createBucket(bucket);
    }
    
    console.log('\n✅ Configuración de almacenamiento completada con éxito.');
    console.log('\nResumen de buckets configurados:');
    
    // Listar todos los buckets
    const { data: buckets, error } = await storageRequest('/bucket', 'GET');
    
    if (error) {
      console.warn('No se pudieron listar los buckets:', error.message);
      return;
    }
    
    if (buckets && buckets.length > 0) {
      console.log('\nBuckets configurados correctamente:');
      buckets.forEach((bucket: any) => {
        console.log(`- ${bucket.name} (${bucket.public ? 'Público' : 'Privado'})`);
      });
    } else {
      console.log('No se encontraron buckets configurados.');
    }
    
  } catch (error) {
    console.error('❌ Error en la configuración de almacenamiento:', error.message || error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
