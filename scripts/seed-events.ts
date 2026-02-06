/**
 * Script para crear eventos de prueba
 * Ejecutar: npx tsx scripts/seed-events.ts
 */

import { config } from 'dotenv';
config();

import { db } from '../src/db.js';
import { events } from '../src/schema/events.js';
import { users } from '../src/schema/users.js';
import { eq } from 'drizzle-orm';

async function seedEvents() {
  console.log('🌱 Iniciando seed de eventos...\n');

  try {
    // Buscar un usuario existente para usarlo como organizador
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      console.log('❌ No hay usuarios en la base de datos. Crea un usuario primero.');
      process.exit(1);
    }

    const organizerId = existingUsers[0].id;
    console.log(`✅ Usando organizador: ${existingUsers[0].email}\n`);

    // Eventos de prueba
    const testEvents = [
      {
        organizerId,
        title: 'Taller de Ilustración Digital Avanzada',
        slug: 'taller-ilustracion-digital-avanzada',
        description: 'Aprende las técnicas más avanzadas de ilustración digital con Procreate. En este taller intensivo de 4 horas, exploraremos desde los fundamentos hasta técnicas profesionales de ilustración. Perfecto para artistas que quieren llevar su trabajo al siguiente nivel.',
        shortDescription: 'Aprende técnicas avanzadas de ilustración digital con Procreate',
        eventType: 'workshop' as const,
        startDate: new Date('2025-02-15T18:00:00'),
        endDate: new Date('2025-02-15T22:00:00'),
        locationType: 'physical' as const,
        address: 'Calle Arte 123',
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Centro de Arte Digital',
        capacity: 20,
        availableTickets: 15,
        ticketPrice: '25000',
        isFree: false,
        requiresApproval: true,
        enableWaitlist: true,
        status: 'published' as const,
        featuredImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
        tags: ['ilustración', 'digital', 'procreate', 'arte'],
        viewCount: 342,
        saveCount: 67,
        shareCount: 23,
      },
      {
        organizerId,
        title: 'Concierto de Jazz en Vivo',
        slug: 'concierto-jazz-en-vivo',
        description: 'Disfruta de una noche mágica con los mejores exponentes del jazz colombiano. Una experiencia musical única en un ambiente íntimo y acogedor.',
        shortDescription: 'Una noche mágica con los mejores exponentes del jazz colombiano',
        eventType: 'concert' as const,
        startDate: new Date('2025-02-20T20:00:00'),
        endDate: new Date('2025-02-20T23:00:00'),
        locationType: 'physical' as const,
        address: 'Carrera 7 #45-32',
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Jazz Club Bogotá',
        capacity: 100,
        availableTickets: 45,
        ticketPrice: '80000',
        isFree: false,
        requiresApproval: false,
        enableWaitlist: true,
        status: 'published' as const,
        featuredImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200',
        tags: ['jazz', 'música', 'concierto', 'en vivo'],
        viewCount: 567,
        saveCount: 124,
        shareCount: 89,
      },
      {
        organizerId,
        title: 'Exposición: Arte Contemporáneo Colombiano',
        slug: 'exposicion-arte-contemporaneo-colombiano',
        description: 'Una muestra única que reúne las obras más representativas del arte contemporáneo colombiano. Más de 50 obras de 20 artistas nacionales.',
        shortDescription: 'Obras representativas del arte contemporáneo colombiano',
        eventType: 'exhibition' as const,
        startDate: new Date('2025-02-01T10:00:00'),
        endDate: new Date('2025-03-31T18:00:00'),
        locationType: 'physical' as const,
        address: 'Calle 24 #6-00',
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Museo de Arte Moderno',
        capacity: 500,
        availableTickets: 500,
        ticketPrice: '0',
        isFree: true,
        requiresApproval: false,
        enableWaitlist: false,
        status: 'published' as const,
        featuredImage: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=1200',
        tags: ['arte', 'exposición', 'contemporáneo', 'museo'],
        viewCount: 1234,
        saveCount: 256,
        shareCount: 178,
      },
      {
        organizerId,
        title: 'Workshop de Fotografía Urbana',
        slug: 'workshop-fotografia-urbana',
        description: 'Aprende a capturar la esencia de la ciudad con técnicas profesionales de fotografía urbana. Incluye salida práctica por el centro histórico.',
        shortDescription: 'Captura la esencia de la ciudad con técnicas profesionales',
        eventType: 'workshop' as const,
        startDate: new Date('2025-02-25T09:00:00'),
        endDate: new Date('2025-02-25T17:00:00'),
        locationType: 'physical' as const,
        address: 'Plaza de Bolívar',
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Centro Histórico',
        capacity: 15,
        availableTickets: 3,
        ticketPrice: '150000',
        isFree: false,
        requiresApproval: true,
        enableWaitlist: true,
        status: 'published' as const,
        featuredImage: 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=1200',
        tags: ['fotografía', 'urbana', 'workshop', 'ciudad'],
        viewCount: 189,
        saveCount: 45,
        shareCount: 23,
      },
      {
        organizerId,
        title: 'Festival de Teatro Independiente',
        slug: 'festival-teatro-independiente',
        description: 'Tres días de teatro independiente con obras de las mejores compañías locales e internacionales. Incluye charlas con los artistas.',
        shortDescription: 'Tres días de las mejores obras de teatro independiente',
        eventType: 'festival' as const,
        startDate: new Date('2025-03-10T16:00:00'),
        endDate: new Date('2025-03-12T22:00:00'),
        locationType: 'physical' as const,
        address: 'Carrera 5 #12-45',
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Teatro La Candelaria',
        capacity: 200,
        availableTickets: 78,
        ticketPrice: '45000',
        isFree: false,
        requiresApproval: false,
        enableWaitlist: true,
        status: 'published' as const,
        featuredImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
        tags: ['teatro', 'festival', 'artes escénicas', 'independiente'],
        viewCount: 423,
        saveCount: 98,
        shareCount: 67,
      },
    ];

    console.log('📝 Creando eventos...\n');

    for (const eventData of testEvents) {
      // Verificar si el evento ya existe
      const existing = await db.select().from(events).where(eq(events.slug, eventData.slug)).limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Evento ya existe: ${eventData.title}`);
        continue;
      }

      await db.insert(events).values(eventData);
      console.log(`✅ Creado: ${eventData.title}`);
    }

    console.log('\n🎉 Seed completado exitosamente!');

    // Mostrar eventos creados
    const allEvents = await db.select({
      id: events.id,
      title: events.title,
      status: events.status,
    }).from(events);

    console.log('\n📋 Eventos en la base de datos:');
    allEvents.forEach(e => {
      console.log(`   - [${e.id}] ${e.title} (${e.status})`);
    });

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedEvents();
