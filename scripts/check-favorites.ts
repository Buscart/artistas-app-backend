import { db } from '../src/db.js';
import { sql } from 'drizzle-orm';

async function checkFavorites() {
  try {
    console.log('🔍 Consultando favoritos guardados...\n');

    const favorites = await db.execute(sql`
      SELECT * FROM favorites
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    console.log(`📊 Total de favoritos encontrados: ${favorites.length}\n`);

    if (favorites.length > 0) {
      console.log('Favoritos guardados:');
      (favorites as any).forEach((fav: any, index: number) => {
        console.log(`${index + 1}. ID: ${fav.id}, User: ${fav.user_id}, Entity: ${fav.entity_type} #${fav.entity_id}, Fecha: ${fav.created_at}`);
      });
    } else {
      console.log('❌ No hay favoritos guardados');
    }

    console.log('\n🔍 Verificando si existen artistas con esos IDs...\n');

    const artists = await db.execute(sql`
      SELECT id, "artistName", "stageName" FROM artists
      WHERE id IN (4, 9, 15, 21, 31, 43, 46)
      ORDER BY id;
    `);

    console.log(`📊 Artistas encontrados: ${artists.length}\n`);

    if (artists.length > 0) {
      console.log('Artistas en la base de datos:');
      (artists as any).forEach((artist: any) => {
        console.log(`- ID ${artist.id}: ${artist.artistName || artist.stageName || 'Sin nombre'}`);
      });
    } else {
      console.log('❌ Ninguno de esos artistas existe en la base de datos');
      console.log('💡 Los artistas del explorer son datos mock/seed que no están en la DB');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFavorites();
