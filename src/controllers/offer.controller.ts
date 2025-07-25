import { Request, Response } from 'express';
import { db } from '../db';
import { offers, users, artists } from '../schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

// Esquema de validación para crear una oferta
const createOfferSchema = z.object({
  title: z.string().optional(),
  artistId: z.number().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  budgetMin: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val)
    .refine(val => val >= 0, { message: 'El presupuesto mínimo no puede ser negativo' })
    .optional(),
  budgetMax: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val)
    .refine(val => val >= 0, { message: 'El presupuesto máximo no puede ser negativo' })
    .optional(),
  modality: z.enum(['presencial', 'online', 'ambas']).default('presencial'),
  eventDate: z.union([z.string(), z.date()])
    .transform(val => typeof val === 'string' ? new Date(val) : val)
    .refine(date => !isNaN(date.getTime()), { message: 'Fecha inválida' })
    .optional(),
  eventTime: z.string().optional(),
  location: z.string().optional(),
  duration: z.string().optional(),
});

// Crear una nueva oferta
export const createOffer = async (req: Request, res: Response) => {
  console.log('🔔 Iniciando creación de oferta...');
  console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));

  try {
    const result = createOfferSchema.safeParse(req.body);
    if (!result.success) {
      console.error('❌ Error de validación:', result.error.flatten());
      return res.status(400).json({
        success: false,
        message: 'Datos de oferta inválidos',
        errors: result.error.flatten(),
      });
    }

    const clientId = req.user?.id; // 🔑 Es string
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado: usuario no autenticado',
      });
    }

    // Combinar fecha y hora si ambos están presentes
    let eventDateTime = null;
    if (result.data.eventDate) {
      eventDateTime = new Date(result.data.eventDate);
      
      // Si hay hora, combinarla con la fecha
      if (result.data.eventTime) {
        const [hours, minutes] = result.data.eventTime.split(':').map(Number);
        eventDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    const [newOffer] = await db
      .insert(offers)
      .values({
        clientId: clientId,
        title: result.data.title || `${result.data.category} - ${result.data.description.substring(0, 30)}...`,
        artistId: result.data.artistId || null,
        category: result.data.category,
        description: result.data.description,
        budgetMin: result.data.budgetMin?.toString() || '0',
        budgetMax: result.data.budgetMax?.toString() || '0',
        modality: result.data.modality,
        eventDate: eventDateTime,
        eventTime: result.data.eventTime || null,
        location: result.data.location || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newOffer,
    });

  } catch (error: any) {
    console.error('❌ Error al crear oferta:', error);

    const errorDetails = {
      name: error?.name || 'UnknownError',
      message: error?.message || 'Error desconocido',
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint
    };

    console.error('📌 Detalles:', errorDetails);

    res.status(500).json({
      success: false,
      message: 'Error interno al crear la oferta',
      error: errorDetails,
    });
  }
};

// Obtener todas las ofertas del usuario actual
export const getUserOffers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const userOffers = await db
      .select()
      .from(offers)
      .where(
        or(
          eq(offers.clientId, userId), // ✅ clientId es string
          userId.startsWith('artist_')
            ? eq(offers.artistId, parseInt(userId.split('_')[1]))
            : sql`FALSE`
        )
      )
      .orderBy(desc(offers.createdAt));

    res.json(userOffers);

  } catch (error) {
    console.error('Error al obtener ofertas:', error);
    res.status(500).json({ message: 'Error al obtener las ofertas' });
  }
};

// Obtener una oferta por ID
export const getOfferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const [offer] = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.id, parseInt(id)),
          or(
            eq(offers.clientId, userId), // ✅ clientId es string
            userId.startsWith('artist_')
              ? eq(offers.artistId, parseInt(userId.split('_')[1]))
              : sql`FALSE`
          )
        )
      )
      .limit(1);

    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const [client] = await db
      .select()
      .from(users)
      .where(eq(users.id, offer.clientId))
      .limit(1);

    let artist = null;
    if (offer.artistId) {
      [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.id, offer.artistId))
        .limit(1);
    }

    res.json({
      ...offer,
      client: client ? { id: client.id, name: `${client.firstName} ${client.lastName}` } : null,
      artist: artist ? { id: artist.id, name: artist.artistName } : null,
    });

  } catch (error) {
    console.error('Error al obtener oferta:', error);
    res.status(500).json({ message: 'Error al obtener la oferta' });
  }
};

// Actualizar estado
export const updateOfferStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const [offer] = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.id, parseInt(id)),
          or(
            eq(offers.clientId, userId), // ✅ string
            userId.startsWith('artist_')
              ? eq(offers.artistId, parseInt(userId.split('_')[1]))
              : sql`FALSE`
          )
        )
      )
      .limit(1);

    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const [updatedOffer] = await db
      .update(offers)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, parseInt(id)))
      .returning();

    res.json(updatedOffer);

  } catch (error) {
    console.error('Error al actualizar oferta:', error);
    res.status(500).json({ message: 'Error al actualizar la oferta' });
  }
};

export const offerController = {
  create: createOffer,
  getAll: getUserOffers,
  getById: getOfferById,
  updateStatus: updateOfferStatus,
};
