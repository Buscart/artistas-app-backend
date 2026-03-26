/**
 * seed-hierarchy.ts
 * Popula las tablas categories, disciplines y roles con la jerarquía completa.
 * Ejecutar: npx ts-node scripts/seed-hierarchy.ts
 */
import { db } from '../src/db.js';
import { categories, disciplines, roles } from '../src/schema/index.js';
import { eq } from 'drizzle-orm';

const HIERARCHY = [
  {
    id: 'artes-visuales', name: 'Artes Visuales y Plásticas',
    disciplines: [
      { id: 'pintura',        name: 'Pintura',           roles: [{ id: 'pintor',               name: 'Pintor' }] },
      { id: 'escultura',      name: 'Escultura',         roles: [{ id: 'escultor',              name: 'Escultor' }] },
      { id: 'ilustracion',    name: 'Ilustración',       roles: [{ id: 'ilustrador',            name: 'Ilustrador' }] },
      { id: 'graffiti',       name: 'Graffiti y Arte Urbano', roles: [{ id: 'graffitero',       name: 'Artista Urbano' }] },
      { id: 'caricatura',     name: 'Caricatura',        roles: [{ id: 'caricaturista',         name: 'Caricaturista' }] },
      { id: 'fotografia',     name: 'Fotografía',        roles: [{ id: 'fotografo',             name: 'Fotógrafo' }] },
      { id: 'diseno-grafico', name: 'Diseño Gráfico',    roles: [{ id: 'disenador-grafico',     name: 'Diseñador Gráfico' }] },
      { id: 'grabado',        name: 'Grabado',           roles: [{ id: 'grabador',              name: 'Grabador' }] },
      { id: 'ceramica',       name: 'Cerámica',          roles: [{ id: 'ceramista',             name: 'Ceramista' }] },
      { id: 'arte-corporal',  name: 'Arte Corporal',     roles: [{ id: 'maquillador-artistico', name: 'Maquillador Artístico' }, { id: 'tatuador', name: 'Tatuador' }] },
      { id: 'artesania',      name: 'Artesanía',         roles: [{ id: 'artesano',              name: 'Artesano' }] },
    ],
  },
  {
    id: 'artes-escenicas', name: 'Artes Escénicas',
    disciplines: [
      { id: 'musica',         name: 'Música',       roles: [{ id: 'musico', name: 'Músico' }, { id: 'cantante', name: 'Cantante' }, { id: 'dj', name: 'DJ' }, { id: 'productor-musical', name: 'Productor Musical' }] },
      { id: 'danza',          name: 'Danza',        roles: [{ id: 'bailarin', name: 'Bailarín' }, { id: 'coreografo', name: 'Coreógrafo' }] },
      { id: 'teatro',         name: 'Teatro',       roles: [{ id: 'actor', name: 'Actor' }, { id: 'director-teatro', name: 'Director de Teatro' }] },
      { id: 'circo',          name: 'Circo',        roles: [{ id: 'artista-circense', name: 'Artista Circense' }] },
      { id: 'magia',          name: 'Magia',        roles: [{ id: 'mago', name: 'Mago' }] },
      { id: 'stand-up',       name: 'Stand-up',     roles: [{ id: 'comediante', name: 'Comediante' }] },
      { id: 'performance',    name: 'Performance',  roles: [{ id: 'artista-performance', name: 'Artista de Performance' }] },
      { id: 'opera',          name: 'Ópera',        roles: [{ id: 'cantante-opera', name: 'Cantante de Ópera' }] },
      { id: 'arte-callejero', name: 'Arte Callejero', roles: [{ id: 'artista-callejero', name: 'Artista Callejero' }] },
    ],
  },
  {
    id: 'medios-audiovisuales', name: 'Medios Audiovisuales',
    disciplines: [
      { id: 'cine',         name: 'Cine',        roles: [{ id: 'actor-cine', name: 'Actor de Cine' }, { id: 'director-cine', name: 'Director de Cine' }] },
      { id: 'television',   name: 'Televisión',  roles: [{ id: 'presentador-tv', name: 'Presentador de Televisión' }, { id: 'actor-tv', name: 'Actor de Televisión' }] },
      { id: 'radio',        name: 'Radio',       roles: [{ id: 'locutor', name: 'Locutor' }] },
      { id: 'streaming',    name: 'Streaming',   roles: [{ id: 'streamer', name: 'Streamer' }] },
      { id: 'podcast',      name: 'Podcast',     roles: [{ id: 'podcaster', name: 'Podcaster' }] },
      { id: 'animacion',    name: 'Animación',   roles: [{ id: 'animador', name: 'Animador' }] },
      { id: 'doblaje',      name: 'Doblaje',     roles: [{ id: 'actor-doblaje', name: 'Actor de Doblaje' }] },
      { id: 'locucion',     name: 'Locución',    roles: [{ id: 'locutor-comercial', name: 'Locutor' }] },
      { id: 'videoarte',    name: 'Videoarte',   roles: [{ id: 'videoartista', name: 'Videoartista' }] },
    ],
  },
  {
    id: 'moda-diseno', name: 'Moda y Diseño',
    disciplines: [
      { id: 'moda',             name: 'Moda',                roles: [{ id: 'modelo', name: 'Modelo' }, { id: 'disenador-moda', name: 'Diseñador de Moda' }, { id: 'estilista', name: 'Estilista' }, { id: 'maquillador', name: 'Maquillador' }, { id: 'peluquero', name: 'Peluquero' }] },
      { id: 'diseno-interiores',name: 'Diseño de Interiores',roles: [{ id: 'disenador-interiores', name: 'Diseñador de Interiores' }, { id: 'decorador', name: 'Decorador' }] },
      { id: 'arquitectura',     name: 'Arquitectura',        roles: [{ id: 'arquitecto', name: 'Arquitecto' }] },
      { id: 'diseno-producto',  name: 'Diseño de Producto',  roles: [{ id: 'disenador-producto', name: 'Diseñador de Producto' }] },
      { id: 'diseno-textil',    name: 'Diseño Textil',       roles: [{ id: 'disenador-textil', name: 'Diseñador Textil' }] },
      { id: 'diseno-joyas',     name: 'Diseño de Joyas',     roles: [{ id: 'joyero', name: 'Joyero' }] },
    ],
  },
  {
    id: 'cultura-turismo', name: 'Cultura y Turismo',
    disciplines: [
      { id: 'turismo-cultural',   name: 'Turismo Cultural',    roles: [{ id: 'guia-turistico', name: 'Guía Turístico' }] },
      { id: 'narrativa-educacion',name: 'Narrativa y Educación',roles: [{ id: 'narrador', name: 'Narrador' }] },
      { id: 'gestion-cultural',   name: 'Gestión Cultural',    roles: [{ id: 'gestor-cultural', name: 'Gestor Cultural' }] },
      { id: 'patrimonio',         name: 'Patrimonio',          roles: [{ id: 'conservador', name: 'Conservador' }, { id: 'restaurador', name: 'Restaurador' }] },
    ],
  },
  {
    id: 'arte-digital-tecnologia', name: 'Arte Digital y Tecnología',
    disciplines: [
      { id: 'diseno-digital',       name: 'Diseño Digital',       roles: [{ id: 'disenador-ux-ui', name: 'Diseñador UX/UI' }, { id: 'disenador-web', name: 'Diseñador Web' }] },
      { id: 'desarrollo-creativo',  name: 'Desarrollo Creativo',  roles: [{ id: 'desarrollador-creativo', name: 'Desarrollador Creativo' }] },
      { id: 'contenido-digital',    name: 'Contenido Digital',    roles: [{ id: 'creador-contenido', name: 'Creador de Contenido' }, { id: 'community-manager', name: 'Community Manager' }] },
      { id: 'arte-generativo',      name: 'Arte Generativo',      roles: [{ id: 'artista-digital', name: 'Artista Digital' }] },
      { id: 'produccion-digital',   name: 'Producción Digital',   roles: [{ id: 'editor-video', name: 'Editor de Video' }, { id: 'motion-designer', name: 'Motion Designer' }, { id: 'disenador-3d', name: 'Diseñador 3D' }] },
    ],
  },
  {
    id: 'servicios-creativos', name: 'Otros Servicios Creativos',
    disciplines: [
      { id: 'representacion-gestion', name: 'Representación y Gestión', roles: [{ id: 'agente-talento', name: 'Agente de Talento' }, { id: 'manager-artistico', name: 'Mánager Artístico' }] },
      { id: 'promocion-marketing',    name: 'Promoción y Marketing',    roles: [{ id: 'promotor-cultural', name: 'Promotor Cultural' }] },
      { id: 'educacion-mentoria',     name: 'Educación y Mentoría',     roles: [{ id: 'mentor-artistico', name: 'Mentor Artístico' }, { id: 'conferencista', name: 'Conferencista' }] },
      { id: 'servicios-evento',       name: 'Servicios de Evento',      roles: [{ id: 'productor-eventos', name: 'Productor de Eventos' }] },
      { id: 'consultoria-creativa',   name: 'Consultoría Creativa',     roles: [{ id: 'consultor-cultural', name: 'Consultor Cultural' }, { id: 'director-creativo', name: 'Director Creativo' }] },
    ],
  },
];

async function seedHierarchy() {
  console.log('🌱 Iniciando seed de jerarquía...');

  for (const cat of HIERARCHY) {
    // Upsert category
    const [catRow] = await db
      .insert(categories)
      .values({ code: cat.id, name: cat.name })
      .onConflictDoUpdate({ target: categories.code, set: { name: cat.name } })
      .returning({ id: categories.id });

    console.log(`  ✅ Categoría: ${cat.name} (id=${catRow.id})`);

    for (const disc of cat.disciplines) {
      // Upsert discipline
      const [discRow] = await db
        .insert(disciplines)
        .values({ code: disc.id, name: disc.name, categoryId: catRow.id })
        .onConflictDoUpdate({ target: disciplines.code, set: { name: disc.name, categoryId: catRow.id } })
        .returning({ id: disciplines.id });

      console.log(`    📂 Disciplina: ${disc.name} (id=${discRow.id})`);

      for (const role of disc.roles) {
        // Upsert role
        await db
          .insert(roles)
          .values({ code: role.id, name: role.name, disciplineId: discRow.id, categoryId: catRow.id })
          .onConflictDoUpdate({ target: roles.code, set: { name: role.name, disciplineId: discRow.id, categoryId: catRow.id } });

        console.log(`      🎭 Rol: ${role.name}`);
      }
    }
  }

  console.log('\n✅ Seed completado.');
  process.exit(0);
}

seedHierarchy().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
