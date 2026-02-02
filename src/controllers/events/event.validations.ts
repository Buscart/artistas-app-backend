import { z } from 'zod';

// Schema base de validación para la creación de eventos
const baseEventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  shortDescription: z.string().max(300, 'La descripción corta no puede exceder 300 caracteres').optional(),
  startDate: z.string().datetime({ message: 'Fecha de inicio inválida' }),
  endDate: z.string().datetime({ message: 'Fecha de fin inválida' }).optional(),
  timezone: z.string().default('America/Bogota'),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.record(z.string(), z.any()).optional(),
  locationType: z.enum(['physical', 'online', 'hybrid']).default('physical'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  onlineEventUrl: z.string().url('URL de evento online inválida').optional(),
  venueName: z.string().optional(),
  venueDescription: z.string().optional(),
  isFree: z.boolean().default(false),
  ticketPrice: z.number().min(0, 'El precio no puede ser negativo').optional(),
  ticketUrl: z.string().url('URL de tickets inválida').optional(),
  capacity: z.number().int().positive('La capacidad debe ser un número positivo').optional(),
  availableTickets: z.number().int().min(0).optional(),
  featuredImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  videoUrl: z.string().url('URL de video inválida').optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'postponed', 'completed']).default('draft'),
  isFeatured: z.boolean().default(false),
  categoryId: z.number().int().positive().optional(),
  subcategories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  eventType: z.enum(['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other']).default('other'),
  organizerId: z.string().optional(),
  companyId: z.string().optional()
});

// Schema con validaciones adicionales para creación de eventos
export const createEventSchema = baseEventSchema
  .refine(
    (data) => {
      // Validar que startDate sea una fecha futura (con margen de 5 minutos para latencia)
      const startDate = new Date(data.startDate);
      const now = new Date();
      now.setMinutes(now.getMinutes() - 5); // Margen de 5 minutos
      return startDate > now;
    },
    {
      message: 'La fecha de inicio debe ser una fecha futura',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      // Validar que endDate sea mayor que startDate (si se proporciona)
      if (!data.endDate) return true;
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // Validar que si no es gratis, debe tener precio
      if (data.isFree) return true;
      return data.ticketPrice !== undefined && data.ticketPrice > 0;
    },
    {
      message: 'Los eventos de pago deben tener un precio definido',
      path: ['ticketPrice'],
    }
  )
  .refine(
    (data) => {
      // Validar que eventos físicos o híbridos tengan dirección
      if (data.locationType === 'online') return true;
      return data.address || data.city || data.venueName;
    },
    {
      message: 'Los eventos presenciales deben tener una ubicación definida',
      path: ['address'],
    }
  )
  .refine(
    (data) => {
      // Validar que eventos online o híbridos tengan URL
      if (data.locationType === 'physical') return true;
      return !!data.onlineEventUrl;
    },
    {
      message: 'Los eventos online deben tener una URL definida',
      path: ['onlineEventUrl'],
    }
  );

// Schema de validación para la actualización de eventos (todos los campos son opcionales)
// No requiere validación de fecha futura porque puede estar editando eventos existentes
export const updateEventSchema = baseEventSchema.partial().extend({
  id: z.number().int().positive()
}).refine(
  (data) => {
    // Validar que endDate sea mayor que startDate (si ambas se proporcionan)
    if (!data.endDate || !data.startDate) return true;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate > startDate;
  },
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  }
);

// Schema de validación para filtros de eventos
export const eventFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFree: z.boolean().optional(),
  location: z.string().optional(),
  eventType: z.string().optional(),
  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional()
});
