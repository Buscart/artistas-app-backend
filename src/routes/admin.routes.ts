import { Router } from 'express';
import express from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = Router();

// Middleware para parsear JSON
router.use(express.json());

// Ruta de estadísticas
router.get('/statistics', async (req, res) => {
  try {
    // Datos de ejemplo mientras conectamos con la base de datos real
    const statistics = {
      success: true,
      data: {
        stats: {
          artists: 156,
          contracts: 89,
          users: 1247,
          revenue: 245000
        },
        recentContracts: [
          {
            id: 'CON-001',
            artist: { display_name: 'María González' },
            client: { display_name: 'Carlos Rodríguez' },
            service_title: 'Mariachi Tradicional',
            event_date: '2026-03-25',
            price: 3500,
            status: 'active'
          },
          {
            id: 'CON-002', 
            artist: { display_name: 'DJ Pulso' },
            client: { display_name: 'Empresa XYZ' },
            service_title: 'Música Electrónica',
            event_date: '2026-03-28',
            price: 5000,
            status: 'pending_payment'
          }
        ],
        monthlyGrowth: {
          currentMonth: 23,
          lastMonth: 18,
          growthPercentage: '+27.8'
        }
      }
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Error en statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

// Ruta de artistas
router.get('/artists', async (req, res) => {
  try {
    // Datos de ejemplo de artistas
    const artists = [
      {
        id: 'artist-001',
        display_name: 'María González',
        email: 'maria@artistas.com',
        role: 'artist',
        status: 'active',
        artist_profiles: {
          category: 'Mariachi',
          bio: 'Mariachi profesional con 10 años de experiencia',
          experience_years: 10,
          location: 'Monterrey',
          verification_status: 'verified'
        },
        contracts: [],
        reviews: []
      },
      {
        id: 'artist-002',
        display_name: 'DJ Pulso',
        email: 'dj@pulso.com',
        role: 'artist', 
        status: 'active',
        artist_profiles: {
          category: 'DJ',
          bio: 'DJ especialista en música electrónica y eventos',
          experience_years: 5,
          location: 'Guadalajara',
          verification_status: 'pending'
        },
        contracts: [],
        reviews: []
      },
      {
        id: 'artist-003',
        display_name: 'Trío Elegance',
        email: 'trio@elegance.com',
        role: 'artist',
        status: 'inactive',
        artist_profiles: {
          category: 'Música',
          bio: 'Trío especializado en boleros y música romántica',
          experience_years: 8,
          location: 'CDMX',
          verification_status: 'verified'
        },
        contracts: [],
        reviews: []
      }
    ];
    
    res.json({
      success: true,
      data: artists
    });
  } catch (error) {
    console.error('Error en artists:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener artistas'
    });
  }
});

// Ruta de usuarios
router.get('/users', async (req, res) => {
  try {
    // Datos de ejemplo de usuarios
    const users = [
      {
        id: 'user-001',
        display_name: 'Carlos Rodríguez',
        email: 'carlos@email.com',
        role: 'client',
        status: 'active',
        created_at: '2026-01-15',
        client_profiles: {
          phone: '+521234567890',
          location: 'Monterrey'
        },
        contracts: []
      },
      {
        id: 'user-002',
        display_name: 'Ana Martínez',
        email: 'ana@empresa.com',
        role: 'company',
        status: 'active',
        created_at: '2026-02-20',
        company_profiles: {
          company_name: 'Eventos XYZ',
          industry: 'Eventos'
        },
        contracts: []
      },
      {
        id: 'user-003',
        display_name: 'Admin Sistema',
        email: 'admin@artistasapp.com',
        role: 'admin',
        status: 'active',
        created_at: '2025-12-01',
        contracts: []
      }
    ];
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error en users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
});

// Ruta de empresas
router.get('/companies', async (req, res) => {
  try {
    const companies = [
      {
        id: 'comp-001',
        display_name: 'Eventos XYZ',
        email: 'contacto@eventosxyz.com',
        role: 'company',
        status: 'active',
        company_profiles: {
          company_name: 'Eventos XYZ',
          industry: 'Eventos',
          location: 'Monterrey',
          employees_count: 15
        }
      }
    ];
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error en companies:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener empresas'
    });
  }
});

// Ruta de verificaciones
router.get('/verification', async (req, res) => {
  try {
    const verifications = [
      {
        id: 'ver-001',
        user_id: 'artist-002',
        user: { display_name: 'DJ Pulso' },
        document_type: 'identification',
        status: 'pending',
        created_at: '2026-03-20'
      }
    ];
    
    res.json({
      success: true,
      data: verifications
    });
  } catch (error) {
    console.error('Error en verification:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener verificaciones'
    });
  }
});

export default router;
