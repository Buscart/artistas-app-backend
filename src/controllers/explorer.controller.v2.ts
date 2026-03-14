import { Request, Response } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import { users } from '../schema/index.js';
import { explorerService, ExplorerFilters } from '../services/explorer.service.js';

/**
 * Controlador optimizado para el explorador
 * Usa service layer y manejo de errores estandarizado
 */
class ExplorerController {
  /**
   * Obtiene artistas para el explorador con filtros optimizados
   * GET /api/v1/explorer/artists
   */
  static async getArtists(req: Request, res: Response) {
    try {
      const filters: ExplorerFilters = {
        query: req.query.query as string,
        city: req.query.city as string,
        category: req.query.category as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        discipline: req.query.discipline as string,
        role: req.query.role as string,
        sortBy: req.query.sortBy as 'rating' | 'price' | 'newest' | 'distance',
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        availableToday: req.query.availableToday === 'true',
      };

      // Validar límites
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        return res.status(400).json({
          error: 'LIMIT_INVALID',
          message: 'El límite debe estar entre 1 y 100',
        });
      }

      if (filters.offset && filters.offset < 0) {
        return res.status(400).json({
          error: 'OFFSET_INVALID',
          message: 'El offset no puede ser negativo',
        });
      }

      const result = await explorerService.getArtists(filters);

      res.status(200).json({
        success: true,
        ...result,
        meta: {
          queryTime: Date.now(),
          filters: Object.keys(filters).filter(key => filters[key as keyof ExplorerFilters] !== undefined),
        },
      });
    } catch (error: any) {
      console.error('[ExplorerController.getArtists] Error:', error);
      
      // Error handling estandarizado
      if (error.code === '42P01') { // undefined_table
        return res.status(503).json({
          error: 'DATABASE_UNAVAILABLE',
          message: 'Servicio temporalmente no disponible',
        });
      }

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'DATABASE_CONNECTION_FAILED',
          message: 'Error de conexión a la base de datos',
        });
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener artistas',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Obtiene eventos para el explorador
   * GET /api/v1/explorer/events
   */
  static async getEvents(req: Request, res: Response) {
    try {
      const filters: ExplorerFilters = {
        query: req.query.query as string,
        city: req.query.city as string,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        sortBy: req.query.sortBy as 'rating' | 'price' | 'newest' | 'distance',
      };

      const result = await explorerService.getEvents(filters);

      res.status(200).json({
        success: true,
        ...result,
        meta: {
          queryTime: Date.now(),
          filters: Object.keys(filters).filter(key => filters[key as keyof ExplorerFilters] !== undefined),
        },
      });
    } catch (error: any) {
      console.error('[ExplorerController.getEvents] Error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener eventos',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Obtiene venues para el explorador
   * GET /api/v1/explorer/venues
   */
  static async getVenues(req: Request, res: Response) {
    try {
      const filters: ExplorerFilters = {
        query: req.query.query as string,
        city: req.query.city as string,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const result = await explorerService.getVenues(filters);

      res.status(200).json({
        success: true,
        ...result,
        meta: {
          queryTime: Date.now(),
          filters: Object.keys(filters).filter(key => filters[key as keyof ExplorerFilters] !== undefined),
        },
      });
    } catch (error: any) {
      console.error('[ExplorerController.getVenues] Error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener venues',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Obtiene servicios para el explorador
   * GET /api/v1/explorer/services
   */
  static async getServices(req: Request, res: Response) {
    try {
      const filters: ExplorerFilters = {
        query: req.query.query as string,
        category: req.query.category as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const result = await explorerService.getServices(filters);

      res.status(200).json({
        success: true,
        ...result,
        meta: {
          queryTime: Date.now(),
          filters: Object.keys(filters).filter(key => filters[key as keyof ExplorerFilters] !== undefined),
        },
      });
    } catch (error: any) {
      console.error('[ExplorerController.getServices] Error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener servicios',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Obtiene obras de arte para el explorador
   * GET /api/v1/explorer/artworks
   */
  static async getArtworks(req: Request, res: Response) {
    try {
      const filters: ExplorerFilters = {
        query: req.query.query as string,
        category: req.query.category as string,
        city: req.query.city as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      };

      const result = await explorerService.getArtworks(filters);

      res.status(200).json({
        success: true,
        ...result,
        meta: {
          queryTime: Date.now(),
          filters: Object.keys(filters).filter(key => filters[key as keyof ExplorerFilters] !== undefined),
        },
      });
    } catch (error: any) {
      console.error('[ExplorerController.getArtworks] Error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener obras',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Endpoint para limpiar caché (solo admin)
   * DELETE /api/v1/explorer/cache
   */
  static async clearCache(req: Request, res: Response) {
    try {
      const { pattern } = req.body;
      
      // TODO: Verificar si es admin
      // if (!req.user?.isAdmin) {
      //   return res.status(403).json({ error: 'FORBIDDEN' });
      // }

      explorerService.clearCache(pattern);

      res.status(200).json({
        success: true,
        message: pattern ? `Caché limpiado para patrón: ${pattern}` : 'Caché limpiado completamente',
        timestamp: Date.now(),
      });
    } catch (error: any) {
      console.error('[ExplorerController.clearCache] Error:', error);
      
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al limpiar caché',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
    }
  }

  /**
   * Endpoint de health check para el explorador
   * GET /api/v1/explorer/health
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      // Test básico de conexión a DB
      await db.select({ count: sql`count(*)` }).from(users).limit(1);
      
      res.status(200).json({
        status: 'healthy',
        timestamp: Date.now(),
        version: '2.0.0',
        explorer: 'optimized',
      });
    } catch (error: any) {
      console.error('[ExplorerController.healthCheck] Error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error.message,
      });
    }
  }
}

export default ExplorerController;
