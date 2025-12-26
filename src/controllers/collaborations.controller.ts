import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { collaborations, users } from '../schema.js';
import { eq, and, or, desc } from 'drizzle-orm';

// Esquemas de validación
const createCollaborationSchema = z.object({
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  collaborationType: z.enum(['musician', 'producer', 'composer', 'choreographer', 'other']),
  genre: z.string().optional(),
  skills: z.array(z.string()).optional(),
  budget: z.number().min(0).optional(),
  deadline: z.string().optional(),
});

const respondToCollaborationSchema = z.object({
  message: z.string().min(20, 'El mensaje debe tener al menos 20 caracteres'),
  portfolio: z.string().url().optional(),
  proposedRate: z.number().min(0).optional(),
});

/**
 * Obtener todas las solicitudes de colaboración activas
 * GET /api/v1/hiring/collaborations
 */
export const getAllCollaborations = async (req: Request, res: Response) => {
  try {
    const {
      type,
      genre,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = db
      .select({
        collaboration: collaborations,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(collaborations)
      .leftJoin(users, eq(collaborations.userId, users.id))
      .where(eq(collaborations.status, 'active'))
      .orderBy(desc(collaborations.createdAt))
      .$dynamic();

    const results = await query;

    let filteredResults = results;

    // Aplicar filtros
    if (type && typeof type === 'string') {
      filteredResults = filteredResults.filter(r =>
        r.collaboration.collaborationType === type
      );
    }

    if (genre && typeof genre === 'string') {
      filteredResults = filteredResults.filter(r =>
        r.collaboration.genre?.toLowerCase().includes(genre.toLowerCase())
      );
    }

    // Paginación
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const total = filteredResults.length;
    const paginatedResults = filteredResults.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });
  } catch (error) {
    console.error('Error getting collaborations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las colaboraciones' });
  }
};

/**
 * Obtener mis solicitudes de colaboración
 * GET /api/v1/hiring/collaborations/my
 */
export const getMyCollaborations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const results = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.userId, userId))
      .orderBy(desc(collaborations.createdAt));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error getting my collaborations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener tus colaboraciones' });
  }
};

/**
 * Crear nueva solicitud de colaboración
 * POST /api/v1/hiring/collaborations
 */
export const createCollaboration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const result = createCollaborationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    const [collaboration] = await db
      .insert(collaborations)
      .values({
        userId,
        title: data.title,
        description: data.description,
        collaborationType: data.collaborationType,
        genre: data.genre,
        skills: data.skills ? JSON.stringify(data.skills) : null,
        budget: data.budget?.toString(),
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: 'active',
      })
      .returning();

    res.status(201).json({
      success: true,
      data: collaboration,
      message: 'Solicitud de colaboración creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating collaboration:', error);
    res.status(500).json({ success: false, error: 'Error al crear la solicitud de colaboración' });
  }
};

/**
 * Responder a una solicitud de colaboración
 * POST /api/v1/hiring/collaborations/:id/respond
 */
export const respondToCollaboration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const collaborationId = parseInt(req.params.id);
    if (isNaN(collaborationId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const result = respondToCollaborationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Verificar que la colaboración existe y está activa
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId))
      .limit(1);

    if (!collaboration) {
      return res.status(404).json({ success: false, error: 'Solicitud de colaboración no encontrada' });
    }

    if (collaboration.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Esta solicitud ya no está disponible' });
    }

    // TODO: Guardar la respuesta en una tabla de collaboration_responses
    // Por ahora solo devolvemos éxito

    res.status(201).json({
      success: true,
      message: 'Respuesta enviada exitosamente',
    });
  } catch (error) {
    console.error('Error responding to collaboration:', error);
    res.status(500).json({ success: false, error: 'Error al enviar la respuesta' });
  }
};

/**
 * Actualizar solicitud de colaboración
 * PUT /api/v1/hiring/collaborations/:id
 */
export const updateCollaboration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const collaborationId = parseInt(req.params.id);
    if (isNaN(collaborationId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    // Verificar que la colaboración existe y pertenece al usuario
    const [existing] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta solicitud' });
    }

    const [updated] = await db
      .update(collaborations)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(collaborations.id, collaborationId))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Solicitud actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating collaboration:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la solicitud' });
  }
};

/**
 * Eliminar solicitud de colaboración
 * DELETE /api/v1/hiring/collaborations/:id
 */
export const deleteCollaboration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const collaborationId = parseInt(req.params.id);
    if (isNaN(collaborationId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    // Verificar que la colaboración existe y pertenece al usuario
    const [existing] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar esta solicitud' });
    }

    await db
      .delete(collaborations)
      .where(eq(collaborations.id, collaborationId));

    res.json({
      success: true,
      message: 'Solicitud eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting collaboration:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la solicitud' });
  }
};
