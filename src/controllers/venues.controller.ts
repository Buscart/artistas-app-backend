import { Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and } from 'drizzle-orm';
import { venues, companies } from '../schema.js';

export const venuesController = {
  // Obtener todos los venues (público - para explorador)
  async getAllVenues(req: any, res: Response) {
    try {
      console.log('🔍 Obteniendo todos los venues disponibles');

      // Obtener parámetros de filtro
      const { city, venue_type, min_capacity, max_capacity, min_price, max_price, available, limit, offset } = req.query;

      // Query con LEFT JOIN a companies para obtener datos de la empresa
      let query: any = storage.db
        .select({
          venue: venues,
          company: companies
        })
        .from(venues)
        .leftJoin(companies, eq(venues.companyId, companies.id));

      // Aplicar filtros si existen
      const conditions = [];

      if (city) {
        conditions.push(eq(venues.city, city as string));
      }

      if (venue_type) {
        conditions.push(eq(venues.venueType, venue_type as string));
      }

      if (available !== undefined) {
        conditions.push(eq(venues.isAvailable, available === 'true'));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.orderBy(venues.createdAt);

      // Extraer venues con sus empresas
      let allVenues = results.map((r: any) => ({
        ...r.venue,
        company: r.company // Incluir datos de la empresa
      }));

      // Filtros adicionales que requieren código (min/max)
      if (min_capacity) {
        const minCap = parseInt(min_capacity as string);
        allVenues = allVenues.filter((v: any) => v.capacity && v.capacity >= minCap);
      }

      if (max_capacity) {
        const maxCap = parseInt(max_capacity as string);
        allVenues = allVenues.filter((v: any) => v.capacity && v.capacity <= maxCap);
      }

      if (min_price) {
        const minPr = parseFloat(min_price as string);
        allVenues = allVenues.filter((v: any) => v.dailyRate && parseFloat(v.dailyRate) >= minPr);
      }

      if (max_price) {
        const maxPr = parseFloat(max_price as string);
        allVenues = allVenues.filter((v: any) => v.dailyRate && parseFloat(v.dailyRate) <= maxPr);
      }

      // Aplicar paginación
      const start = offset ? parseInt(offset as string) : 0;
      const end = limit ? start + parseInt(limit as string) : allVenues.length;
      const paginatedVenues = allVenues.slice(start, end);

      // Transformar datos para coincidir con el formato del frontend
      const transformedVenues = paginatedVenues.map((venue: any) => ({
        id: venue.id,
        companyId: venue.companyId, // ✅ Agregado: ID de la empresa asociada
        name: venue.name,
        description: venue.description || '',
        venue_type: venue.venueType || '',
        venueType: venue.venueType || '', // Añadido para compatibilidad
        address: venue.address || '',
        city: venue.city || '',
        state: '', // No tenemos estado en DB
        country: 'Colombia',
        capacity: venue.capacity || 0,
        amenities: venue.services || [],
        services: venue.services || [], // Añadido para compatibilidad
        price_per_hour: venue.dailyRate || '0',
        dailyRate: venue.dailyRate || '0', // Añadido para compatibilidad
        available: venue.isAvailable || false,
        isAvailable: venue.isAvailable || false, // Añadido para compatibilidad
        images: (venue.multimedia as any)?.gallery || (venue.multimedia as any)?.images || [],
        multimedia: venue.multimedia || {}, // Añadido: multimedia completo
        contact: venue.contact || {}, // Añadido: información de contacto
        openingHours: venue.openingHours || {}, // Añadido: horarios
        coordinates: venue.coordinates || null, // Añadido: coordenadas
        rating: venue.rating ? parseFloat(venue.rating.toString()) : 0,
        total_reviews: venue.totalReviews || 0,
        totalReviews: venue.totalReviews || 0, // Añadido para compatibilidad
        created_at: venue.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: venue.updatedAt?.toISOString() || new Date().toISOString(),
        createdAt: venue.createdAt,
        updatedAt: venue.updatedAt
      }));

      console.log(`✅ Se encontraron ${allVenues.length} venues (mostrando ${paginatedVenues.length})`);

      return res.status(200).json({
        success: true,
        data: transformedVenues,
        total: allVenues.length,
        count: paginatedVenues.length
      });

    } catch (error) {
      console.error('❌ Error en getAllVenues:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los espacios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  // Obtener todos los venues de una company
  async getVenuesByCompany(req: any, res: Response) {
    try {
      const { companyId } = req.params;
      const userId = req.user?.id;

      console.log(`🔍 Buscando venues para la company: ${companyId}`);

      // Verificar que la company existe y pertenece al usuario
      const company = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(companyId)))
        .limit(1);

      if (!company || company.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }

      // Verificar que el usuario es el dueño
      if (userId && company[0].userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a estos espacios'
        });
      }

      // Obtener los venues de la company
      const companyVenues = await storage.db
        .select()
        .from(venues)
        .where(eq(venues.companyId, parseInt(companyId)))
        .orderBy(venues.createdAt);

      console.log(`✅ Se encontraron ${companyVenues.length} espacios para la company ${companyId}`);

      return res.status(200).json({
        success: true,
        data: companyVenues,
        count: companyVenues.length
      });

    } catch (error) {
      console.error('❌ Error en getVenuesByCompany:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los espacios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  // Obtener un venue específico
  async getVenueById(req: any, res: Response) {
    try {
      const { id } = req.params;

      const venue = await storage.db
        .select()
        .from(venues)
        .where(eq(venues.id, parseInt(id)))
        .limit(1);

      if (!venue || venue.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Espacio no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: venue[0]
      });

    } catch (error) {
      console.error('❌ Error en getVenueById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el espacio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  // Crear un nuevo venue
  async createVenue(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      const { companyId } = req.params;
      const venueData = req.body;

      console.log(`📝 Creando venue para la company: ${companyId}`);

      // Verificar que la company existe y pertenece al usuario
      const company = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(companyId)))
        .limit(1);

      if (!company || company.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }

      if (company[0].userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para agregar espacios a esta empresa'
        });
      }

      // Preparar datos del venue
      const newVenueData = {
        companyId: parseInt(companyId),
        name: venueData.name,
        description: venueData.description,
        venueType: venueData.type,
        capacity: venueData.capacity,
        dailyRate: venueData.price ? venueData.price.toString() : null,
        address: company[0].address, // Heredar de la company
        city: company[0].city,
        services: venueData.amenities || [],
        openingHours: {
          hours: venueData.openingHours,
          priceType: venueData.priceType,
          tags: venueData.tags || []
        },
        isAvailable: venueData.status === 'available' || venueData.status === 'open',
        multimedia: {
          images: venueData.images || [],
          tags: venueData.tags || []
        },
        contact: company[0].socialMedia || {},
        coordinates: company[0].coordinates || null
      };

      const [newVenue] = await storage.db
        .insert(venues)
        .values(newVenueData)
        .returning();

      console.log(`✅ Venue creado exitosamente con ID: ${newVenue.id}`);

      return res.status(201).json({
        success: true,
        data: newVenue,
        message: 'Espacio creado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en createVenue:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear el espacio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  // Actualizar un venue
  async updateVenue(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      const { id, companyId } = req.params;
      const venueData = req.body;

      console.log(`📝 Actualizando venue: ${id}`);

      // Verificar que el venue existe
      const existingVenue = await storage.db
        .select()
        .from(venues)
        .where(eq(venues.id, parseInt(id)))
        .limit(1);

      if (!existingVenue || existingVenue.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Espacio no encontrado'
        });
      }

      // Verificar que la company pertenece al usuario
      const company = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(companyId)))
        .limit(1);

      if (!company || company.length === 0 || company[0].userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para editar este espacio'
        });
      }

      // Preparar datos actualizados
      const updatedVenueData = {
        name: venueData.name,
        description: venueData.description,
        venueType: venueData.type,
        capacity: venueData.capacity,
        dailyRate: venueData.price ? venueData.price.toString() : null,
        services: venueData.amenities || [],
        openingHours: {
          hours: venueData.openingHours,
          priceType: venueData.priceType,
          tags: venueData.tags || []
        },
        isAvailable: venueData.status === 'available' || venueData.status === 'open',
        multimedia: {
          images: venueData.images || [],
          tags: venueData.tags || []
        },
        updatedAt: new Date()
      };

      const [updatedVenue] = await storage.db
        .update(venues)
        .set(updatedVenueData)
        .where(eq(venues.id, parseInt(id)))
        .returning();

      console.log(`✅ Venue actualizado exitosamente: ${id}`);

      return res.status(200).json({
        success: true,
        data: updatedVenue,
        message: 'Espacio actualizado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en updateVenue:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el espacio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  },

  // Eliminar un venue
  async deleteVenue(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      const { id, companyId } = req.params;

      console.log(`🗑️ Eliminando venue: ${id}`);

      // Verificar que el venue existe
      const existingVenue = await storage.db
        .select()
        .from(venues)
        .where(eq(venues.id, parseInt(id)))
        .limit(1);

      if (!existingVenue || existingVenue.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Espacio no encontrado'
        });
      }

      // Verificar que la company pertenece al usuario
      const company = await storage.db
        .select()
        .from(companies)
        .where(eq(companies.id, parseInt(companyId)))
        .limit(1);

      if (!company || company.length === 0 || company[0].userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este espacio'
        });
      }

      await storage.db
        .delete(venues)
        .where(eq(venues.id, parseInt(id)));

      console.log(`✅ Venue eliminado exitosamente: ${id}`);

      return res.status(200).json({
        success: true,
        message: 'Espacio eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error en deleteVenue:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar el espacio',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
};
