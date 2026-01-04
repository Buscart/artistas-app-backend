import { Request, Response } from 'express';
import { db } from '../db.js';
import { users, artists, companies, reviews } from '../schema.js';
import { eq, and, or, desc, sql } from 'drizzle-orm';

// Nota: Se removieron tipos externos no definidos (User, Artist) para evitar conflictos de compilación.

// Obtener todos los perfiles con filtros
export const getProfiles = async (req: Request, res: Response) => {
  try {
    const { category, city, minRating, limit = '10', offset = '0' } = req.query;
    
    // Construir condiciones base
    // Solo buscar artistas verificados (las empresas se manejan por tabla companies separada)
    const conditions = [
      eq(users.userType, 'artist'),
      eq(users.isVerified, true)
    ];

    // Agregar condiciones de filtro si existen
    if (city) conditions.push(eq(users.city, city as string));
    if (minRating) conditions.push(sql`${users.rating} >= ${Number(minRating)}`);
    if (category) {
      const categoryConditions = [];
      
      if (artists.categoryId) {
        categoryConditions.push(eq(artists.categoryId, Number(category)));
      }
      
      if (artists.subcategories) {
        categoryConditions.push(sql`${artists.subcategories} @> ARRAY[${category}]::text[]`);
      }
      
      if (categoryConditions.length > 0) {
        conditions.push(or(...categoryConditions));
      }
    }

    // Construir consulta final
    const query = db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        profileImageUrl: users.profileImageUrl,
        coverImageUrl: users.coverImageUrl,
        userType: users.userType,
        bio: users.bio,
        city: users.city,
        rating: users.rating,
        totalReviews: users.totalReviews,
        isFeatured: users.isFeatured,
        isAvailable: users.isAvailable,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(artists, eq(users.id, artists.userId))
      .where(and(...conditions))
      .orderBy(desc(users.isFeatured), desc(users.rating))
      .limit(Number(limit))
      .offset(Number(offset));

    const profiles = await query;
    
    // Mapear y enriquecer los datos
    const enrichedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const profileData: any = { ...profile };
        
        // Obtener detalles adicionales según el tipo de perfil
        if (profile.userType === 'artist' && profile.id) {
          const [artist] = await db
            .select()
            .from(artists)
            .where(eq(artists.userId, profile.id));
          
          if (artist) {
            profileData.artist = artist;
            
            // Calcular estadísticas
            profileData.stats = {
              totalReviews: Number(profile.totalReviews) || 0,
              averageRating: Number(profile.rating) || 0,
              yearsExperience: artist.yearsOfExperience || 0,
              // Usar viewCount como aproximación de eventos si es necesario
              totalEvents: artist.viewCount ? Math.floor(Number(artist.viewCount) / 2) : 0
            };
          }
        }

        return profileData;
      })
    );

    res.json(enrichedProfiles);
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ message: 'Error al obtener los perfiles' });
  }
};

// Obtener un perfil por ID
export const getProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obtener datos básicos del usuario
    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    const profileData: any = { ...profile };
    
    // Obtener detalles adicionales según el tipo de perfil
    if (profile.userType === 'artist' && profile.id) {
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, id));
      
      if (artist) {
        profileData.artist = artist;
        
        // Calcular estadísticas
        profileData.stats = {
          totalReviews: Number(profile.totalReviews) || 0,
          averageRating: Number(profile.rating) || 0,
          yearsExperience: artist.yearsOfExperience || 0,
          totalEvents: artist.viewCount ? Math.floor(Number(artist.viewCount) / 2) : 0
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

// Obtener reseñas de un perfil
export const getProfileReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10', offset = '0' } = req.query;
    
    // Verificar si el perfil existe
    const [profile] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    
    const limitNum = Number(limit) || 10;
    const offsetNum = Number(offset) || 0;
    
    // Obtener reseñas del perfil
    const profileReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,

        score: reviews.score,
        comment: reviews.reason,
        type: reviews.type,
        createdAt: reviews.createdAt
      })
      .from(reviews)
      // .where(
      //   or(
      //     sql`reviews.artist_id IN (SELECT id FROM artists WHERE user_id = ${id})`,
      //     sql`reviews.venue_id IN (SELECT id FROM venues WHERE company_id IN (SELECT id FROM companies WHERE user_id = ${id}))`
      //   )
      // );

    // Obtener estadísticas de calificaciones
    const [ratingStats] = await db
      .select({
        average: sql<number>`COALESCE(AVG(score), 0) as average`,
        count: sql<number>`COUNT(*) as count`,

      })
      .from(reviews)
      // .where(
      //   or(
      //     sql`reviews.artist_id IN (SELECT id FROM artists WHERE user_id = ${id})`,
      //     sql`reviews.venue_id IN (SELECT id FROM venues WHERE company_id IN (SELECT id FROM companies WHERE user_id = ${id}))`
      //   )
      // );
    
    res.json({
      reviews: profileReviews,
      stats: {
        averageRating: ratingStats?.average ? parseFloat(String(ratingStats.average)) : 0,
        totalReviews: ratingStats?.count ? parseInt(String(ratingStats.count)) : 0,
        ratingDistribution: ratingStats?.distribution || []
      }
    });
  } catch (error) {
    console.error('Error al obtener reseñas del perfil:', error);
    res.status(500).json({ message: 'Error al obtener las reseñas del perfil' });
  }
};

// Obtener perfil público completo (con trabajos destacados y toda la información)
export const getPublicProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Obtener datos básicos del usuario
    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const profileData: any = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      displayName: profile.displayName,
      userType: profile.userType,
      profileImageUrl: profile.profileImageUrl,
      coverImageUrl: profile.coverImageUrl,
      city: profile.city,
      bio: profile.bio,
      shortBio: profile.shortBio,
      rating: profile.rating,
      projectsCompleted: 0, // TODO: implementar sistema de proyectos
      reviewsCount: profile.totalReviews,
      followersCount: profile.fanCount || 0,
      followingCount: 0, // TODO: implementar sistema de following
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
    };

    // Obtener detalles adicionales según el tipo de perfil
    if (profile.userType === 'artist') {
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, id));

      if (artist) {
        // Formatear datos del artista con información de categorías
        profileData.artistData = {
          stageName: artist.stageName,
          professionalTitle: artist.stageName || artist.artistName, // Usar stageName o artistName como título
          category: artist.categoryId ? {
            id: artist.categoryId,
            code: artist.categoryId.toString(),
            name: 'Categoría' // TODO: obtener nombre real de la categoría
          } : null,
          discipline: artist.disciplineId ? {
            id: artist.disciplineId,
            code: artist.disciplineId.toString(),
            name: 'Disciplina' // TODO: obtener nombre real
          } : null,
          role: artist.roleId ? {
            id: artist.roleId,
            code: artist.roleId.toString(),
            name: 'Rol' // TODO: obtener nombre real
          } : null,
          specialization: artist.specializationId ? {
            id: artist.specializationId,
            code: artist.specializationId.toString(),
            name: 'Especialización' // TODO: obtener nombre real
          } : null,
          yearsOfExperience: artist.yearsOfExperience,
          availability: artist.availability || {},
          tags: artist.tags || [],
          portfolioUrl: null, // El portfolio se obtiene desde portfolioPhotos
          baseCity: artist.baseCity || profile.city,
          // Información académica y profesional
          education: artist.education || [],
          languages: artist.languages || [],
          licenses: artist.licenses || [],
          linkedAccounts: artist.linkedAccounts || {},
          workExperience: artist.workExperience || [],
          // Información de precios
          hourlyRate: artist.hourlyRate,
          pricingType: artist.pricingType,
          priceRange: artist.priceRange,
          // Información profesional adicional
          experience: artist.experience,
          artistType: artist.artistType,
          travelAvailability: artist.travelAvailability,
          travelDistance: artist.travelDistance,
        };

        // Obtener trabajos destacados del portafolio
        try {
          // Usar consulta SQL directa para evitar problemas de tipos
          const featuredWorkResult: any = await db.execute(sql`
            SELECT *
            FROM portfolio_photos
            WHERE user_id = ${id}
              AND is_featured = true
              AND is_public = true
            ORDER BY order_position ASC
            LIMIT 4
          `);
          profileData.featuredWork = Array.isArray(featuredWorkResult) ? featuredWorkResult : [];
        } catch (error) {
          console.error('Error al obtener trabajos destacados:', error);
          profileData.featuredWork = [];
        }

        // Calcular estadísticas públicas
        profileData.stats = {
          totalProjects: 0, // TODO: implementar contador de proyectos
          totalReviews: Number(profile.totalReviews) || 0,
          averageRating: Number(profile.rating) || 0,
          responseTime: '< 24h', // TODO: calcular tiempo de respuesta real
        };
      }
    } else {
      // Para usuarios tipo 'client', 'company', o 'general' (contratantes)
      // Agregar estadísticas básicas
      profileData.stats = {
        totalProjects: 0, // TODO: implementar contador de proyectos publicados
        totalReviews: Number(profile.totalReviews) || 0,
        averageRating: Number(profile.rating) || 0,
        responseTime: '< 24h',
      };

      // Agregar datos adicionales para empresas si existen
      if (profile.userType === 'company') {
        // TODO: Implementar datos de empresa cuando exista la tabla
        profileData.companyData = {
          companyName: profile.displayName || `${profile.firstName} ${profile.lastName}`,
          industry: null, // TODO: agregar campo industry
          size: null, // TODO: agregar campo company size
          website: null, // TODO: agregar campo website
        };
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Error al obtener perfil público:', error);
    res.status(500).json({ message: 'Error al obtener el perfil público' });
  }
};

// Controlador para compatibilidad con rutas
export const profileController = {
  getAll: getProfiles,
  getById: getProfileById,
  getReviews: getProfileReviews,
  getPublic: getPublicProfile
};
