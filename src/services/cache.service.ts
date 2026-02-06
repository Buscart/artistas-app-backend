import NodeCache from 'node-cache';

/**
 * Servicio de caché en memoria para optimizar consultas frecuentes.
 *
 * TTL por defecto: 5 minutos para datos que cambian frecuentemente.
 * TTL extendido: 15 minutos para datos que cambian poco.
 */

// Instancia única del caché
const cache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar expiración cada minuto
  useClones: false, // No clonar objetos para mejor rendimiento
  deleteOnExpire: true,
});

// Prefijos para diferentes tipos de datos
export const CacheKeys = {
  // Eventos
  EVENT_BY_ID: (id: number) => `event:${id}`,
  EVENTS_UPCOMING: 'events:upcoming',
  EVENTS_PUBLIC: 'events:public',
  EVENTS_BY_USER: (userId: string) => `events:user:${userId}`,
  EVENTS_REGISTERED: (userId: string) => `events:registered:${userId}`,
  EVENTS_ATTENDED: (userId: string) => `events:attended:${userId}`,

  // Asistentes
  EVENT_ATTENDEES: (eventId: number) => `attendees:event:${eventId}`,
  ATTENDEE_STATS: (eventId: number) => `attendees:stats:${eventId}`,

  // Reseñas
  EVENT_REVIEWS: (eventId: number) => `reviews:event:${eventId}`,
} as const;

// TTLs personalizados (en segundos)
export const CacheTTL = {
  SHORT: 60,        // 1 minuto - datos muy dinámicos
  MEDIUM: 300,      // 5 minutos - datos moderadamente dinámicos
  LONG: 900,        // 15 minutos - datos poco dinámicos
  VERY_LONG: 3600,  // 1 hora - datos casi estáticos
} as const;

export const cacheService = {
  /**
   * Obtener un valor del caché
   */
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  /**
   * Guardar un valor en el caché
   */
  set<T>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): boolean {
    return cache.set(key, value, ttl);
  },

  /**
   * Eliminar un valor del caché
   */
  del(key: string | string[]): number {
    return cache.del(key);
  },

  /**
   * Verificar si una clave existe
   */
  has(key: string): boolean {
    return cache.has(key);
  },

  /**
   * Limpiar todo el caché
   */
  flush(): void {
    cache.flushAll();
  },

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return cache.getStats();
  },

  /**
   * Invalidar caché relacionado con un evento
   */
  invalidateEvent(eventId: number): void {
    const keysToDelete = [
      CacheKeys.EVENT_BY_ID(eventId),
      CacheKeys.EVENT_ATTENDEES(eventId),
      CacheKeys.ATTENDEE_STATS(eventId),
      CacheKeys.EVENT_REVIEWS(eventId),
      CacheKeys.EVENTS_UPCOMING,
      CacheKeys.EVENTS_PUBLIC,
    ];
    cache.del(keysToDelete);
  },

  /**
   * Invalidar caché relacionado con un usuario
   */
  invalidateUserEvents(userId: string): void {
    const keysToDelete = [
      CacheKeys.EVENTS_BY_USER(userId),
      CacheKeys.EVENTS_REGISTERED(userId),
      CacheKeys.EVENTS_ATTENDED(userId),
    ];
    cache.del(keysToDelete);
  },

  /**
   * Invalidar caché de asistentes de un evento
   */
  invalidateEventAttendees(eventId: number): void {
    const keysToDelete = [
      CacheKeys.EVENT_ATTENDEES(eventId),
      CacheKeys.ATTENDEE_STATS(eventId),
    ];
    cache.del(keysToDelete);
  },

  /**
   * Wrapper para obtener o calcular un valor
   * Si existe en caché, lo retorna. Si no, ejecuta la función y guarda el resultado.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    cache.set(key, value, ttl);
    return value;
  },
};

export default cacheService;
