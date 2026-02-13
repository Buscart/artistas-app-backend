import { db } from '../db.js';
import { users, artists } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
// Obtener artistas destacados
export const getFeatured = async (req, res) => {
    try {
        const featuredArtists = await db
            .select()
            .from(users)
            .where(and(eq(users.userType, 'artist'), eq(users.isFeatured, true)))
            .limit(10);
        res.json(featuredArtists);
    }
    catch (error) {
        console.error('Error fetching featured artists:', error);
        res.status(500).json({ message: 'Error al obtener artistas destacados' });
    }
};
// Obtener todos los artistas
export const getAll = async (req, res) => {
    try {
        const allArtists = await db
            .select()
            .from(users)
            .where(eq(users.userType, 'artist'))
            .orderBy(users.firstName, users.lastName);
        res.json(allArtists);
    }
    catch (error) {
        console.error('Error fetching all artists:', error);
        res.status(500).json({ message: 'Error al obtener la lista de artistas' });
    }
};
// Obtener un artista por ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const artist = await db
            .select()
            .from(users)
            .where(and(eq(users.id, id), eq(users.userType, 'artist')));
        if (artist.length === 0) {
            return res.status(404).json({ message: 'Artista no encontrado' });
        }
        // Obtener detalles adicionales del artista
        const artistDetails = await db
            .select()
            .from(artists)
            .where(eq(artists.userId, id));
        const artistData = artist[0];
        const response = {
            ...artistData,
            isFeatured: artistData.isFeatured ?? false, // Asegurar que no sea null
            rating: artistData.rating ? parseFloat(artistData.rating) : null,
            totalReviews: artistData.totalReviews ?? 0,
            details: artistDetails[0] || null
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching artist by ID:', error);
        res.status(500).json({ message: 'Error al obtener el artista' });
    }
};
// Exportar controlador para compatibilidad con rutas existentes
export const artistController = {
    async getFeatured(req, res) {
        try {
            const featuredArtists = await db
                .select()
                .from(users)
                .where(and(eq(users.userType, 'artist'), eq(users.isFeatured, true)))
                .limit(10);
            res.json(featuredArtists);
        }
        catch (error) {
            console.error('Error fetching featured artists:', error);
            res.status(500).json({ error: 'Error fetching featured artists' });
        }
    },
    async getAll(req, res) {
        try {
            const allArtists = await db
                .select()
                .from(users)
                .where(eq(users.userType, 'artist'))
                .orderBy(sql `${users.rating} DESC`);
            res.json(allArtists);
        }
        catch (error) {
            console.error('Error fetching artists:', error);
            res.status(500).json({ error: 'Error fetching artists' });
        }
    },
    async getById(req, res) {
        try {
            const [artist] = await db
                .select()
                .from(users)
                .where(and(eq(users.id, req.params.id), eq(users.userType, 'artist')))
                .limit(1);
            if (!artist) {
                return res.status(404).json({ error: 'Artist not found' });
            }
            res.json(artist);
        }
        catch (error) {
            console.error('Error fetching artist:', error);
            res.status(500).json({ error: 'Error fetching artist' });
        }
    }
};
