import { db } from '../src/db';
import { users, artists } from '../src/schema';
import { eq } from 'drizzle-orm';

async function verifySeed() {
  try {
    console.log('🔍 Verificando artistas creados...\n');

    // Obtener 5 artistas de ejemplo
    const artistUsers = await db
      .select()
      .from(users)
      .where(eq(users.userType, 'artist'))
      .limit(5);

    for (const user of artistUsers) {
      const [artistProfile] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, user.id))
        .limit(1);

      console.log('━'.repeat(80));
      console.log(`👤 Usuario: ${user.username} (${user.email})`);
      console.log(`   Nombre: ${user.displayName}`);
      console.log(`   Ciudad: ${user.city}`);
      console.log(`   Teléfono: ${user.phone}`);
      console.log(`   Instagram: ${(user.socialMedia as any)?.instagram || 'N/A'}`);
      console.log(`   Rating: ${user.rating} ⭐ (${user.totalReviews} reseñas)`);
      console.log(`   Verificado: ${user.isVerified ? '✅' : '❌'}`);

      if (artistProfile) {
        console.log(`\n🎨 Perfil de Artista:`);
        console.log(`   Rol: ${(artistProfile.customStats as any)?.rol_principal || 'N/A'}`);
        console.log(`   Disciplina: ${(artistProfile.customStats as any)?.disciplina || 'N/A'}`);
        console.log(`   Categoría: ${(artistProfile.customStats as any)?.categoria || 'N/A'}`);
        console.log(`   Especialización: ${(artistProfile.customStats as any)?.especializacion || 'N/A'}`);
        console.log(`   Experiencia: ${artistProfile.yearsOfExperience} años (${(artistProfile.customStats as any)?.nivel || 'N/A'})`);
        console.log(`   Precio/hora: $${artistProfile.pricePerHour} COP`);
        console.log(`   Tags: ${artistProfile.tags?.join(', ') || 'N/A'}`);
        console.log(`   Tipos de servicio: ${artistProfile.serviceTypes?.join(', ') || 'N/A'}`);
        console.log(`   Viaja: ${artistProfile.travelAvailability ? `Sí (hasta ${artistProfile.travelDistance}km)` : 'No'}`);
      }
      console.log('');
    }

    console.log('━'.repeat(80));

    // Contar total de artistas
    const totalArtists = await db
      .select()
      .from(users)
      .where(eq(users.userType, 'artist'));

    console.log(`\n✅ Total de artistas en la base de datos: ${totalArtists.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifySeed();
