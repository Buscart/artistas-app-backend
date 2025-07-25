import { Request, Response } from 'express';
import { db } from '../db';
import { users, artists, companies, reviews } from '../schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import type { User, Artist } from '../types/schema';

// Interfaz extendida para el perfil completo
export interface FullProfile extends User {
  artist?: Artist | null;
  company?: any | null;
  stats?: {
    totalReviews: number;
    averageRating: number;
    totalEvents?: number;
    yearsExperience?: number;
  };
}

// Obtener todos los perfiles con filtros
export const getProfiles = async (req: Request, res: Response) => {
  try {
    const { category, city, minRating, limit = '10', offset = '0' } = req.query;
    
    // Construir condiciones base
    const conditions = [
      or(
        eq(users.userType, 'artist'),
        eq(users.userType, 'company')
      ),
      eq(users.isVerified, true)
    ];

    // Agregar condiciones de filtro si existen
    if (city) conditions.push(eq(users.city, city as string));
    if (minRating) conditions.push(sql`${users.rating} >= ${Number(minRating)}`);
    if (category) {
      conditions.push(
        or(
          eq(artists.categoryId, Number(category)),
          sql`${artists.subcategories} @> ARRAY[${category}]::text[]`
        )
      );
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
        } else if (profile.userType === 'company' && profile.id) {
          // Lógica para empresas si es necesario
          profileData.stats = {
            totalReviews: profile.totalReviews,
            averageRating: profile.rating
          };
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
    } else if (profile.userType === 'company') {
      // Lógica para empresas si es necesario
      profileData.stats = {
        totalReviews: Number(profile.totalReviews) || 0,
        averageRating: Number(profile.rating) || 0
      };
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
        userName: sql<string>`${users.firstName} || ' ' || COALESCE(${users.lastName}, '')`,
        userImage: users.profileImageUrl,
        score: reviews.score,
        comment: reviews.reason,
        type: reviews.type,
        createdAt: reviews.createdAt
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(
        or(
          and(
            eq(reviews.type, 'artist'),
            sql`${reviews.artistId}::integer = ${parseInt(id) || 0}`
          ),
          and(
            eq(reviews.type, 'venue'), 
            sql`${reviews.venueId}::integer = ${parseInt(id) || 0}`
          )
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(limitNum)
      .offset(offsetNum);
    
    // Obtener estadísticas de calificaciones
    const [ratingStats] = await db
      .select({
        average: sql<number>`COALESCE(AVG(score), 0) as average`,
        count: sql<number>`COUNT(*) as count`,
        distribution: sql<Array<{rating: number, count: number}>>`
          COALESCE(
            array_agg(
              json_build_object(
                'rating', FLOOR(score),
                'count', COUNT(*)
              )
            ) FILTER (WHERE score IS NOT NULL),
            '{}'::json[]
          ) as distribution
        `
      })
      .from(reviews)
      .where(
        or(
          and(
            eq(reviews.type, 'artist'),
            sql`${reviews.artistId}::integer = ${parseInt(id) || 0}`
          ),
          and(
            eq(reviews.type, 'venue'), 
            sql`${reviews.venueId}::integer = ${parseInt(id) || 0}`
          )
        )
      );
    
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

// Controlador para compatibilidad con rutas
export const profileController = {
  getAll: getProfiles,
  getById: getProfileById,
  getReviews: getProfileReviews
};
