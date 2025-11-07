import { Request, Response } from 'express';
import { userContractsStorage } from '../storage/userContracts.js';
import { z } from 'zod';

// Esquemas de validación
const createQuotationSchema = z.object({
  artistId: z.string().min(1, 'El ID del artista es requerido'),
  serviceType: z.string().min(1, 'El tipo de servicio es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  preferredDate: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const respondQuotationSchema = z.object({
  quotedAmount: z.number().min(0, 'El monto debe ser mayor a 0'),
  artistResponse: z.string().min(10, 'La respuesta debe tener al menos 10 caracteres'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'quoted', 'accepted', 'rejected', 'expired']),
});

/**
 * Obtener todas las cotizaciones del usuario autenticado
 * GET /api/v1/quotations/my
 */
export const getMyQuotations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    const quotations = await userContractsStorage.getUserQuotations(userId, {
      limit,
      offset,
      status,
    });

    res.json({ success: true, data: quotations });
  } catch (error) {
    console.error('Error getting my quotations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las cotizaciones' });
  }
};

/**
 * Obtener cotizaciones recibidas (artista)
 * GET /api/v1/quotations/received
 */
export const getReceivedQuotations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    // Obtener cotizaciones donde el usuario es el artista
    const { db } = await import('../db.js');
    const { userQuotations } = await import('../schema.js');
    const { eq, and, desc } = await import('drizzle-orm');

    const conditions = [eq(userQuotations.artistId, userId)];
    if (status) {
      conditions.push(eq(userQuotations.status, status as any));
    }

    const quotations = await db
      .select()
      .from(userQuotations)
      .where(and(...conditions))
      .orderBy(desc(userQuotations.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ success: true, data: quotations });
  } catch (error) {
    console.error('Error getting received quotations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las cotizaciones recibidas' });
  }
};

/**
 * Obtener una cotización por ID
 * GET /api/v1/quotations/:id
 */
export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const quotationId = parseInt(req.params.id);
    if (isNaN(quotationId)) {
      return res.status(400).json({ success: false, error: 'ID de cotización inválido' });
    }

    const quotation = await userContractsStorage.getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    // Verificar que el usuario sea el creador o el artista
    if (quotation.userId !== userId && quotation.artistId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para ver esta cotización' });
    }

    res.json({ success: true, data: quotation });
  } catch (error) {
    console.error('Error getting quotation:', error);
    res.status(500).json({ success: false, error: 'Error al obtener la cotización' });
  }
};

/**
 * Crear nueva solicitud de cotización
 * POST /api/v1/quotations
 */
export const createQuotation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const result = createQuotationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Calcular fecha de expiración (30 días por defecto)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const quotation = await userContractsStorage.createQuotation({
      userId,
      artistId: data.artistId,
      serviceType: data.serviceType,
      title: data.title,
      description: data.description,
      budgetMin: data.budgetMin?.toString(),
      budgetMax: data.budgetMax?.toString(),
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
      location: data.location,
      status: 'pending',
      expiresAt,
      metadata: data.metadata || {},
    });

    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Solicitud de cotización creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ success: false, error: 'Error al crear la solicitud de cotización' });
  }
};

/**
 * Responder a una cotización (solo para el artista)
 * POST /api/v1/quotations/:id/respond
 */
export const respondToQuotation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const quotationId = parseInt(req.params.id);
    if (isNaN(quotationId)) {
      return res.status(400).json({ success: false, error: 'ID de cotización inválido' });
    }

    const result = respondQuotationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const data = result.data;

    // Verificar que la cotización existe y que el usuario es el artista
    const quotation = await userContractsStorage.getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    if (quotation.artistId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para responder a esta cotización' });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Esta cotización ya fue respondida' });
    }

    const updated = await userContractsStorage.respondToQuotation(
      quotationId,
      data.quotedAmount,
      data.artistResponse
    );

    res.json({
      success: true,
      data: updated,
      message: 'Respuesta enviada exitosamente',
    });
  } catch (error) {
    console.error('Error responding to quotation:', error);
    res.status(500).json({ success: false, error: 'Error al responder a la cotización' });
  }
};

/**
 * Aceptar una cotización (convertir en contrato)
 * POST /api/v1/quotations/:id/accept
 */
export const acceptQuotation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const quotationId = parseInt(req.params.id);
    if (isNaN(quotationId)) {
      return res.status(400).json({ success: false, error: 'ID de cotización inválido' });
    }

    // Verificar que la cotización existe y que el usuario es el creador
    const quotation = await userContractsStorage.getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    if (quotation.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para aceptar esta cotización' });
    }

    if (quotation.status !== 'quoted') {
      return res.status(400).json({ success: false, error: 'Solo puedes aceptar cotizaciones con respuesta' });
    }

    const result = await userContractsStorage.acceptQuotation(quotationId);

    res.json({
      success: true,
      data: result,
      message: 'Cotización aceptada y contrato creado exitosamente',
    });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({ success: false, error: 'Error al aceptar la cotización' });
  }
};

/**
 * Actualizar estado de cotización
 * PATCH /api/v1/quotations/:id/status
 */
export const updateQuotationStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const quotationId = parseInt(req.params.id);
    if (isNaN(quotationId)) {
      return res.status(400).json({ success: false, error: 'ID de cotización inválido' });
    }

    const result = updateStatusSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: result.error.flatten(),
      });
    }

    const { status } = result.data;

    // Verificar que la cotización existe y que el usuario tiene permiso
    const quotation = await userContractsStorage.getQuotationById(quotationId);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    if (quotation.userId !== userId && quotation.artistId !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta cotización' });
    }

    const updated = await userContractsStorage.updateQuotationStatus(quotationId, status);

    res.json({
      success: true,
      data: updated,
      message: 'Estado actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el estado' });
  }
};
