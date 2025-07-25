import { db } from '../src/db';
import { users, artists, categories } from '../src/schema';
import { sql, eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  try {
    // 1. Verificar o crear categoría
    console.log('📝 Verificando categorías...');
    const existingCategories = await db
      .select()
      .from(categories)
      .where(sql`name = 'Música'`);

    let musicCategory = existingCategories[0];

    if (!musicCategory) {
      console.log('📝 Creando categoría Música...');
      [musicCategory] = await db
        .insert(categories)
        .values({
          name: 'Música',
          description: 'Artistas musicales y bandas',
        })
        .returning();
      console.log('✅ Categoría creada:', musicCategory);
    } else {
      console.log('ℹ️  La categoría Música ya existe:', musicCategory);
    }

    // 2. Verificar o crear usuario cliente
    console.log('👤 Verificando usuario de prueba...');
    const existingClient = await db
      .select()
      .from(users)
      .where(sql`email = 'cliente@ejemplo.com'`)
      .then(rows => rows[0]);

    let clientUser = existingClient;
    if (!clientUser) {
      console.log('👤 Creando usuario de prueba...');
      // Generar hash de la contraseña
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      [clientUser] = await db
        .insert(users)
        .values({
          id: `client_${Date.now()}`,
          email: 'cliente@ejemplo.com',
          password: hashedPassword,
          firstName: 'Juan',
          lastName: 'Pérez',
          displayName: 'Juan Pérez',
          userType: 'general',
          isVerified: true,
        })
        .returning();
      console.log('✅ Usuario cliente creado con contraseña hasheada');
    } else {
      console.log('ℹ️  El usuario de prueba ya existe. Actualizando contraseña...');
      // Actualizar la contraseña si el usuario ya existe
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(sql`id = ${clientUser.id}`);
      console.log('✅ Contraseña actualizada para el usuario existente');
    }

    // 3. Verificar o crear usuario artista
    console.log('🎨 Verificando usuario artista...');
    const existingArtistUser = await db
      .select()
      .from(users)
      .where(sql`email = 'artista@ejemplo.com'`)
      .then(rows => rows[0]);

    let artistUser = existingArtistUser;
    if (!artistUser) {
      console.log('🎨 Creando usuario artista...');
      const artistPassword = await bcrypt.hash('password123', 10);
      [artistUser] = await db
        .insert(users)
        .values({
          id: `artist_${Date.now()}`,
          email: 'artista@ejemplo.com',
          firstName: 'María',
          lastName: 'González',
          displayName: 'María la cantante',
          userType: 'artist',
          isVerified: true,
        })
        .returning();
      console.log('✅ Usuario artista creado:', artistUser);
    } else {
      console.log('ℹ️  El usuario artista ya existe:', artistUser);
    }

    // 4. Verificar la estructura de la tabla artists
    console.log('🔍 Verificando estructura de la tabla artists...');
    try {
      // Obtener los tipos de columnas de la tabla artists
      const columnTypes = await db
        .select()
        .from(artists)
        .limit(1)
        .then(() => {
          // Si llegamos aquí, la consulta fue exitosa
          console.log('✅ La tabla artists existe');
          return db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'artists';
          `);
        });
      
      console.log('📋 Estructura de la tabla artists:');
      console.log(columnTypes);
    } catch (error) {
      console.error('❌ Error al verificar la estructura de la tabla artists:', error);
      throw error;
    }

    // 5. Verificar o crear perfil de artista
    console.log('🎤 Verificando perfil de artista...');
    const [existingArtist] = await db
      .select()
      .from(artists)
      .where(eq(artists.userId, artistUser.id))
      .limit(1);

    let artistProfile;
    if (existingArtist) {
      console.log('ℹ️  El perfil de artista ya existe:', existingArtist);
      artistProfile = existingArtist;
    } else {
      console.log('🎵 Creando perfil de artista...');
      
      // Primero, insertar solo los campos obligatorios
      const artistData = {
        userId: artistUser.id,
        artistName: 'María la cantante',
        
        // Campos con tipos explícitos
        artistType: 'solo' as const, // Usando 'as const' para tipo literal
        experience: 3, // Nivel de experiencia: 1=principiante, 2=intermedio, 3=profesional, 4=experto
        yearsOfExperience: 10,
        description: 'Cantante profesional con 10 años de experiencia en eventos en vivo',
        bio: 'María González es una cantante profesional con una amplia trayectoria en el mundo de la música. Con más de 10 años de experiencia, ha participado en numerosos eventos y festivales a nivel nacional.',
        baseCity: 'Bogotá',
        isAvailable: true,
        isProfileComplete: true,
        isVerified: true,
        
        // Incluir categoryId si existe
        categoryId: musicCategory?.id || null,
        
        // Inicializar campos JSON con objetos vacíos
        socialMedia: {},
        portfolio: {},
        gallery: [],
        availability: {},
        priceRange: null,
        services: [],
        metadata: {},
        
        // Inicializar contadores en 0
        rating: '0.00',
        totalReviews: 0,
        fanCount: 0,
        viewCount: 0
      };
      
      try {
        [artistProfile] = await db
          .insert(artists)
          .values(artistData)
          .returning();
        console.log('✅ Perfil de artista creado con éxito');
      } catch (error) {
        console.error('❌ Error al crear el perfil de artista:', error);
        throw error; // Relanzar el error para que se maneje en el catch externo
      }
    }

    console.log('\n✨ Seed completado exitosamente!');
    console.log('\n🔑 Credenciales de prueba:');
    console.log('------------------------');
    console.log('Cliente:');
    console.log(`- Email: ${clientUser.email}`);
    console.log('- Contraseña: password123');
    console.log('\nArtista:');
    console.log(`- Email: ${artistUser.email}`);
    console.log('- Contraseña: password123');
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seed();
