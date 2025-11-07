import { db } from '../src/db';
import { users, artists, categories, disciplines, roles, specializations } from '../src/schema';
import bcrypt from 'bcrypt';

// Datos de ejemplo para generar perfiles variados
const FIRST_NAMES = [
  'Ana', 'Carlos', 'María', 'José', 'Laura', 'David', 'Sofia', 'Miguel', 'Isabel', 'Andrés',
  'Valentina', 'Santiago', 'Camila', 'Alejandro', 'Daniela', 'Juan', 'Carolina', 'Pedro', 'Gabriela', 'Luis',
  'Natalia', 'Diego', 'Paula', 'Ricardo', 'Mariana', 'Felipe', 'Juliana', 'Sebastián', 'Andrea', 'Tomás'
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores',
  'Vargas', 'Castillo', 'Morales', 'Jiménez', 'Rojas', 'Gutiérrez', 'Díaz', 'Mendoza', 'Romero', 'Ortiz',
  'Silva', 'Castro', 'Ruiz', 'Álvarez', 'Guerrero', 'Medina', 'Navarro', 'Cruz', 'Hernández', 'Muñoz'
];

const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga',
  'Pereira', 'Manizales', 'Ibagué', 'Pasto', 'Cúcuta', 'Armenia', 'Villavicencio'
];

const PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
];

// Función helper para generar un número aleatorio
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función helper para elegir un elemento aleatorio de un array
function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Función para generar una bio realista basada en el rol
function generateBio(roleName: string, disciplineName: string, yearsExp: number): string {
  const templates = [
    `Profesional de ${disciplineName.toLowerCase()} especializado en ${roleName.toLowerCase()} con ${yearsExp} años de experiencia. Apasionado por mi trabajo y comprometido con la excelencia en cada proyecto.`,
    `${roleName} con ${yearsExp} años en la industria. Me dedico a crear experiencias memorables y trabajar con profesionalismo en cada oportunidad.`,
    `Experiencia de ${yearsExp} años como ${roleName.toLowerCase()}. He trabajado en numerosos proyectos destacados y siempre busco superarme profesionalmente.`,
    `${roleName} profesional con trayectoria de ${yearsExp} años. Especializado en ${disciplineName.toLowerCase()}, con amplia experiencia en diversos tipos de eventos y proyectos.`,
  ];
  return randomChoice(templates);
}

// Función para generar precio por hora basado en experiencia
function generatePrice(yearsExp: number): number {
  const basePrice = 50000;
  const expMultiplier = 1 + (yearsExp / 20); // Más años = más caro
  const randomFactor = 0.8 + Math.random() * 0.4; // ±20% de variación
  return Math.round(basePrice * expMultiplier * randomFactor / 10000) * 10000; // Redondear a 10k
}

// Función para generar username único
function generateUsername(firstName: string, lastName: string, index: number): string {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[áéíóú]/g, (c) => {
    const map: {[key: string]: string} = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
    return map[c] || c;
  });
  return `${base}${index}`;
}

// Función para generar descripción detallada del artista
function generateDetailedBio(roleName: string, disciplineName: string, categoryName: string, yearsExp: number, city: string): string {
  return `${roleName} profesional con ${yearsExp} años de experiencia en ${disciplineName.toLowerCase()}. ` +
         `Especializado en el área de ${categoryName.toLowerCase()}, con sede en ${city}. ` +
         `He trabajado en diversos proyectos destacados y cuento con amplia experiencia en eventos corporativos, ` +
         `sociales y culturales. Mi compromiso es ofrecer un servicio de calidad excepcional en cada presentación.`;
}

async function seedArtists() {
  console.log('🌱 Iniciando generación de perfiles de artistas...\n');

  try {
    // 1. Obtener todas las categorías del sistema
    console.log('📋 Obteniendo estructura de categorías...');
    const allCategories = await db.select().from(categories);
    const allDisciplines = await db.select().from(disciplines);
    const allRoles = await db.select().from(roles);
    const allSpecializations = await db.select().from(specializations);

    console.log(`✅ Encontradas ${allCategories.length} categorías`);
    console.log(`✅ Encontradas ${allDisciplines.length} disciplinas`);
    console.log(`✅ Encontradas ${allRoles.length} roles`);
    console.log(`✅ Encontradas ${allSpecializations.length} especializaciones\n`);

    if (allRoles.length === 0) {
      console.error('❌ No se encontraron roles en la base de datos.');
      console.log('Por favor, ejecuta primero los scripts de migración de la jerarquía de artistas.');
      process.exit(1);
    }

    // 2. Generar perfiles de artistas
    const NUM_ARTISTS = 50; // Puedes cambiar este número
    console.log(`🎨 Generando ${NUM_ARTISTS} perfiles de artistas...\n`);

    const password = await bcrypt.hash('password123', 10);
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < NUM_ARTISTS; i++) {
      try {
        // Elegir un rol aleatorio
        const role: any = randomChoice(allRoles);
        const discipline = allDisciplines.find((d: any) => d.id === role.disciplineId);
        const category = allCategories.find((c: any) => c.id === role.categoryId);

        // Obtener especializaciones para este rol
        const roleSpecs = allSpecializations.filter((s: any) => s.roleId === role.id);
        const specialization: any = roleSpecs.length > 0 ? randomChoice(roleSpecs) : null;

        // Generar datos del usuario
        const firstName = randomChoice(FIRST_NAMES);
        const lastName = randomChoice(LAST_NAMES);
        const city = randomChoice(CITIES);
        const yearsExp = randomInt(1, 15);
        const experience = yearsExp <= 2 ? 1 : yearsExp <= 5 ? 2 : yearsExp <= 10 ? 3 : 4;

        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@ejemplo.com`;
        const userId = `artist_seed_${Date.now()}_${i}`;
        const username = generateUsername(firstName, lastName, i);
        const artistName = `${firstName} ${lastName}`;
        const stageName = Math.random() > 0.5 ? `${firstName} "${randomChoice(['El', 'La'])} ${randomChoice(['Maestro', 'Pro', 'Artista', 'Talento'])}"` : null;
        const detailedBio = generateDetailedBio(role.name, discipline?.name || 'Arte', category?.name || 'Artes', yearsExp, city);

        // Crear usuario
        const [user] = await db
          .insert(users)
          .values({
            id: userId,
            email,
            password,
            firstName,
            lastName,
            displayName: stageName || artistName,
            username,
            profileImageUrl: randomChoice(PROFILE_IMAGES),
            userType: 'artist',
            bio: detailedBio,
            shortBio: generateBio(role.name, discipline?.name || 'arte', yearsExp),
            city,
            phone: `+57 ${randomInt(300, 350)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
            website: Math.random() > 0.7 ? `https://www.${username}.com` : null,
            socialMedia: {
              instagram: `@${username}`,
              facebook: Math.random() > 0.5 ? artistName : null,
              twitter: Math.random() > 0.6 ? `@${username}` : null,
              tiktok: Math.random() > 0.7 ? `@${username}` : null,
            },
            isVerified: Math.random() > 0.3, // 70% verificados
            isFeatured: Math.random() > 0.8, // 20% destacados
            isAvailable: Math.random() > 0.2, // 80% disponibles
            rating: (3 + Math.random() * 2).toFixed(2), // Rating entre 3 y 5
            totalReviews: randomInt(0, 50),
            fanCount: randomInt(0, 200),
            emailVerified: true,
            onboardingCompleted: true,
          })
          .returning();

        // Crear perfil de artista
        const pricePerHour = generatePrice(yearsExp);

        // Generar tags relacionados con el rol y disciplina
        const roleTags = [
          role.name,
          discipline?.name || '',
          category?.name || '',
          city,
          yearsExp > 5 ? 'Experiencia' : 'Talento Emergente'
        ].filter(Boolean);

        await db
          .insert(artists)
          .values({
            userId: user.id,
            artistName,
            stageName,
            categoryId: category?.id || null,
            disciplineId: discipline?.id || null,
            roleId: role.id,
            specializationId: specialization?.id || null,
            tags: roleTags,
            subcategories: specialization ? [specialization.name] : [],
            artistType: randomChoice(['solo', 'duo', 'band', 'collective'] as const),
            presentationType: randomChoice([
              ['En vivo'],
              ['En vivo', 'Online'],
              ['En vivo', 'Grabado'],
              ['En vivo', 'Online', 'Grabado']
            ]),
            serviceTypes: randomChoice([
              ['Shows', 'Eventos'],
              ['Shows', 'Talleres'],
              ['Eventos', 'Talleres', 'Corporativo'],
              ['Shows', 'Eventos', 'Corporativo']
            ]),
            experience,
            yearsOfExperience: yearsExp,
            description: detailedBio,
            bio: detailedBio,
            baseCity: city,
            travelAvailability: Math.random() > 0.4, // 60% viajan
            travelDistance: Math.random() > 0.4 ? randomInt(50, 300) : null,
            isAvailable: user.isAvailable,
            isProfileComplete: true,
            isVerified: user.isVerified,
            pricePerHour: pricePerHour.toString(),
            rating: user.rating,
            totalReviews: user.totalReviews,
            fanCount: user.fanCount,
            viewCount: randomInt(10, 500),
            socialMedia: user.socialMedia,
            gallery: [],
            portfolio: {},
            availability: {
              monday: Math.random() > 0.3,
              tuesday: Math.random() > 0.3,
              wednesday: Math.random() > 0.3,
              thursday: Math.random() > 0.3,
              friday: Math.random() > 0.3,
              saturday: Math.random() > 0.2,
              sunday: Math.random() > 0.4,
            },
            services: [],
            metadata: {
              role: role.name,
              discipline: discipline?.name,
              category: category?.name,
              specialization: specialization?.name,
            },
            customStats: {
              rol_principal: role.name,
              disciplina: discipline?.name || '',
              categoria: category?.name || '',
              especializacion: specialization?.name || 'General',
              años_experiencia: yearsExp,
              nivel: experience === 1 ? 'Principiante' : experience === 2 ? 'Intermedio' : experience === 3 ? 'Profesional' : 'Experto'
            },
          });

        created++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Creados ${i + 1}/${NUM_ARTISTS} artistas...`);
        }

      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          skipped++;
        } else {
          console.error(`❌ Error creando artista ${i + 1}:`, error.message);
        }
      }
    }

    console.log(`\n✨ Seed completado exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   - Artistas creados: ${created}`);
    console.log(`   - Artistas omitidos (duplicados): ${skipped}`);
    console.log(`\n🔑 Todos los usuarios tienen la contraseña: password123`);
    console.log(`📧 Formato de email: nombre.apellido.N@ejemplo.com\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

seedArtists();
