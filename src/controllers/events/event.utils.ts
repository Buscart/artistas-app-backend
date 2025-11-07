import { and, eq, ne } from 'drizzle-orm';
import { db } from '../../db.js';
import { events } from '../../schema.js';

/**
 * Genera un slug único para un evento basado en el título
 * @param title Título del evento
 * @param excludeId ID del evento a excluir (para actualizaciones)
 * @returns Un slug único
 */
export async function generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
  let slugBase = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  let slug = slugBase;
  let counter = 1;
  
  while (true) {
    const [existingSlug] = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.slug, slug),
          excludeId ? ne(events.id, excludeId) : undefined
        )
      )
      .limit(1);
    
    if (!existingSlug) break;
    slug = `${slugBase}-${++counter}`;
  }
  
  return slug;
}

/**
 * Formatea los datos de un evento para la respuesta
 * @param event Datos del evento desde la base de datos
 * @returns Datos formateados para la respuesta
 */
export function formatEventResponse(event: any) {
  return {
    ...event,
    startDate: new Date(event.startDate).toISOString(),
    endDate: event.endDate ? new Date(event.endDate).toISOString() : null,
    images: Array.isArray(event.images) ? event.images : (event.imageUrl ? [event.imageUrl] : []),
    tags: Array.isArray(event.tags) ? event.tags : (typeof event.tags === 'string' ? event.tags.split(',').map((t: string) => t.trim()) : [])
  };
}
