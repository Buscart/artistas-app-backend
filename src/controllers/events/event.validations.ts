import { z } from 'zod';

// Schema de validación para la creación de eventos
export const createEventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
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
  onlineEventUrl: z.string().url().optional(),
  venueName: z.string().optional(),
  venueDescription: z.string().optional(),
  isFree: z.boolean().default(false),
  ticketPrice: z.number().min(0).optional(),
  ticketUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  availableTickets: z.number().int().min(0).optional(),
  featuredImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).default([]),
  videoUrl: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'postponed', 'completed']).default('draft'),
  isFeatured: z.boolean().default(false),
  categoryId: z.number().int().positive().optional(),
  subcategories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  eventType: z.enum(['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other']).default('other'),
  organizerId: z.string()
});

// Schema de validación para la actualización de eventos (todos los campos son opcionales)
export const updateEventSchema = createEventSchema.partial().extend({
  id: z.number().int().positive()
});

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
