import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function diagnose() {
    console.log('\n🔍 === DIAGNÓSTICO DE IMÁGENES DE BLOG ===\n');
    // 1. Verificar variables de entorno
    console.log('1️⃣  Verificando variables de entorno...');
    if (!process.env.SUPABASE_URL) {
        console.error('❌ SUPABASE_URL no está configurada');
        return;
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
        return;
    }
    console.log('✅ Variables de entorno configuradas');
    console.log(`   URL: ${process.env.SUPABASE_URL}`);
    // 2. Listar buckets disponibles
    console.log('\n2️⃣  Listando buckets disponibles...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
        console.error('❌ Error listando buckets:', bucketsError);
        return;
    }
    console.log(`✅ Buckets encontrados: ${buckets.length}`);
    buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    // 3. Verificar bucket 'posts'
    console.log('\n3️⃣  Verificando bucket "posts"...');
    const postsBucket = buckets.find(b => b.name === 'posts');
    if (!postsBucket) {
        console.error('❌ El bucket "posts" NO existe');
        console.log('   Creando bucket "posts"...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('posts', {
            public: true,
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) {
            console.error('❌ Error creando bucket:', createError);
            return;
        }
        console.log('✅ Bucket "posts" creado exitosamente');
    }
    else {
        console.log(`✅ Bucket "posts" existe (${postsBucket.public ? 'público' : 'privado'})`);
    }
    // 4. Intentar subir una imagen de prueba
    console.log('\n4️⃣  Probando subida de imagen...');
    // Crear una imagen PNG 1x1 transparente válida
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngIHDR = Buffer.from([
        0x00, 0x00, 0x00, 0x0D, // Longitud
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // Ancho: 1
        0x00, 0x00, 0x00, 0x01, // Alto: 1
        0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, Color type, etc.
        0x1F, 0x15, 0xC4, 0x89 // CRC
    ]);
    const pngIDAT = Buffer.from([
        0x00, 0x00, 0x00, 0x0A, // Longitud
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0xE2, 0x21, 0xBC, 0x33 // CRC
    ]);
    const pngIEND = Buffer.from([
        0x00, 0x00, 0x00, 0x00, // Longitud
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82 // CRC
    ]);
    const testContent = Buffer.concat([pngHeader, pngIHDR, pngIDAT, pngIEND]);
    const testPath = `blog/test-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(testPath, testContent, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
    });
    if (uploadError) {
        console.error('❌ Error subiendo archivo de prueba:', uploadError);
        return;
    }
    console.log('✅ Archivo de prueba subido exitosamente');
    console.log(`   Path: ${testPath}`);
    // 5. Obtener URL pública
    console.log('\n5️⃣  Obteniendo URL pública...');
    const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(testPath);
    console.log('✅ URL pública generada:');
    console.log(`   ${publicUrl}`);
    // 6. Verificar que se puede acceder a la URL
    console.log('\n6️⃣  Verificando acceso a la URL...');
    try {
        const response = await fetch(publicUrl);
        if (response.ok) {
            console.log('✅ La URL es accesible públicamente');
        }
        else {
            console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
        }
    }
    catch (error) {
        console.error('❌ Error accediendo a la URL:', error);
    }
    // 7. Limpiar archivo de prueba
    console.log('\n7️⃣  Limpiando archivo de prueba...');
    const { error: deleteError } = await supabase.storage
        .from('posts')
        .remove([testPath]);
    if (deleteError) {
        console.error('⚠️  No se pudo eliminar el archivo de prueba:', deleteError);
    }
    else {
        console.log('✅ Archivo de prueba eliminado');
    }
    console.log('\n✅ === DIAGNÓSTICO COMPLETADO ===\n');
}
diagnose().catch(console.error);
