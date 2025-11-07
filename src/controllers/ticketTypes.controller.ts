import type { Request, Response } from 'express';
import { z } from 'zod';
import { ticketTypeStorage } from '../storage/ticketTypes.js';
import { eventStorage } from '../storage/events.js';

// Validation schemas
const createTicketTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  currency: z.string().length(3).default('COP'),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
  saleStart: z.string().datetime().optional(),
  saleEnd: z.string().datetime().optional(),
  minPerOrder: z.number().min(1).default(1),
  maxPerOrder: z.number().min(1).default(10),
  isActive: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
  allowSeatSelection: z.boolean().default(false),
  customFields: z.array(z.any()).default([]),
});

const updateTicketTypeSchema = createTicketTypeSchema.partial();

const bulkCreateTicketTypesSchema = z.array(createTicketTypeSchema);

/**
 * Get all ticket types for an event
 * GET /api/v1/events/:eventId/ticket-types
 */
export const getTicketTypes = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de evento inválido',
      });
    }

    // Verify event exists
    const event = await eventStorage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado',
      });
    }

    const ticketTypes = await ticketTypeStorage.getTicketTypesByEventId(eventId);

    return res.json({
      success: true,
      data: ticketTypes,
    });
  } catch (error) {
    console.error('Error getting ticket types:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los tipos de entradas',
    });
  }
};

/**
 * Get a specific ticket type
 * GET /api/v1/events/:eventId/ticket-types/:id
 */
export const getTicketType = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const ticketTypeId = parseInt(req.params.id);

    if (isNaN(eventId) || isNaN(ticketTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos',
      });
    }

    const ticketType = await ticketTypeStorage.getTicketTypeByEventId(ticketTypeId, eventId);

    if (!ticketType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de entrada no encontrado',
      });
    }

    return res.json({
      success: true,
      data: ticketType,
    });
  } catch (error) {
    console.error('Error getting ticket type:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el tipo de entrada',
    });
  }
};

/**
 * Create a new ticket type
 * POST /api/v1/events/:eventId/ticket-types
 */
export const createTicketType = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de evento inválido',
      });
    }

    // Verify event exists and user is the organizer
    const event = await eventStorage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado',
      });
    }

    // Check authorization
    if (event.organizerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para crear tipos de entradas para este evento',
      });
    }

    // Validate request body
    const validation = createTicketTypeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validation.error.issues,
      });
    }

    const ticketType = await ticketTypeStorage.createTicketType({
      eventId,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      data: ticketType,
      message: 'Tipo de entrada creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating ticket type:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear el tipo de entrada',
    });
  }
};

/**
 * Create multiple ticket types at once
 * POST /api/v1/events/:eventId/ticket-types/bulk
 */
export const createBulkTicketTypes = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de evento inválido',
      });
    }

    // Verify event exists and user is the organizer
    const event = await eventStorage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado',
      });
    }

    // Check authorization
    if (event.organizerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para crear tipos de entradas para este evento',
      });
    }

    // Validate request body
    const validation = bulkCreateTicketTypesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validation.error.issues,
      });
    }

    const ticketTypes = await ticketTypeStorage.createBulkTicketTypes(
      eventId,
      validation.data
    );

    return res.status(201).json({
      success: true,
      data: ticketTypes,
      message: `${ticketTypes.length} tipos de entradas creados exitosamente`,
    });
  } catch (error) {
    console.error('Error creating bulk ticket types:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear los tipos de entradas',
    });
  }
};

/**
 * Update a ticket type
 * PUT /api/v1/events/:eventId/ticket-types/:id
 */
export const updateTicketType = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const ticketTypeId = parseInt(req.params.id);

    if (isNaN(eventId) || isNaN(ticketTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos',
      });
    }

    // Verify ticket type exists and belongs to event
    const existingTicketType = await ticketTypeStorage.getTicketTypeByEventId(
      ticketTypeId,
      eventId
    );
    if (!existingTicketType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de entrada no encontrado',
      });
    }

    // Verify event ownership
    const event = await eventStorage.getEvent(eventId);
    if (!event || event.organizerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para editar este tipo de entrada',
      });
    }

    // Validate request body
    const validation = updateTicketTypeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validation.error.issues,
      });
    }

    const updatedTicketType = await ticketTypeStorage.updateTicketType(
      ticketTypeId,
      validation.data
    );

    return res.json({
      success: true,
      data: updatedTicketType,
      message: 'Tipo de entrada actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating ticket type:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el tipo de entrada',
    });
  }
};

/**
 * Delete a ticket type
 * DELETE /api/v1/events/:eventId/ticket-types/:id
 */
export const deleteTicketType = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const ticketTypeId = parseInt(req.params.id);

    if (isNaN(eventId) || isNaN(ticketTypeId)) {
      return res.status(400).json({
        success: false,
        error: 'IDs inválidos',
      });
    }

    // Verify ticket type exists and belongs to event
    const ticketType = await ticketTypeStorage.getTicketTypeByEventId(ticketTypeId, eventId);
    if (!ticketType) {
      return res.status(404).json({
        success: false,
        error: 'Tipo de entrada no encontrado',
      });
    }

    // Verify event ownership
    const event = await eventStorage.getEvent(eventId);
    if (!event || event.organizerId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar este tipo de entrada',
      });
    }

    // Check if any tickets have been sold
    if (ticketType.soldCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un tipo de entrada que ya tiene ventas',
      });
    }

    await ticketTypeStorage.deleteTicketType(ticketTypeId);

    return res.json({
      success: true,
      message: 'Tipo de entrada eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting ticket type:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar el tipo de entrada',
    });
  }
};

/**
 * Get ticket statistics for an event
 * GET /api/v1/events/:eventId/ticket-types/stats
 */
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de evento inválido',
      });
    }

    // Verify event exists
    const event = await eventStorage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado',
      });
    }

    const stats = await ticketTypeStorage.getEventTicketStats(eventId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas',
    });
  }
};
