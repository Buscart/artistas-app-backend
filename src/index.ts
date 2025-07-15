import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { Express } from 'express';
import apiRoutes from './routes/api.routes.js';
import { db, runMigrations } from './db.js';
import { storage } from './storage/index.js';

// Extend Express types
declare global {
  namespace Express {
    interface Application {
      broadcastResponse: (offerId: number, response: any) => Promise<void>;
      broadcastStatusUpdate: (offerId: number, responseId: number, status: string) => Promise<void>;
    }
  }
}

// Inicializar la aplicación Express
const app = express() as Express;
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Configuración de CORS
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173' // Añadido para desarrollo con Vite
];

// Añadir FRONTEND_URL si está definido
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const offerConnections = new Map<number, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe' && data.offerId) {
        const offerId = parseInt(data.offerId);
        
        if (!offerConnections.has(offerId)) {
          offerConnections.set(offerId, new Set());
        }
        
        offerConnections.get(offerId)!.add(ws);
        console.log(`Client subscribed to offer ${offerId}`);
        
        ws.send(JSON.stringify({
          type: 'subscribed',
          offerId: offerId
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    offerConnections.forEach((connections, offerId) => {
      connections.delete(ws);
      if (connections.size === 0) {
        offerConnections.delete(offerId);
      }
    });
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Add broadcast functions to app
app.broadcastResponse = async (offerId: number, response: any) => {
  const connections = offerConnections.get(offerId);
  if (connections) {
    try {
      // Obtener información del artista usando el storage
      const artist = await storage.artistStorage.getArtist(response.artistId);
      
      if (!artist) {
        console.error(`No se encontró el artista con ID: ${response.artistId}`);
        return;
      }
      
      // Extraer solo los campos necesarios del artista
      const artistData = {
        id: artist.id,
        artistName: artist.artistName,
        userId: artist.userId,
        // Incluir otros campos necesarios del artista
      };
      
      // Crear el mensaje con la información del artista
      const message = JSON.stringify({
        type: 'newResponse',
        offerId: offerId,
        response: {
          ...response,
          artist: artistData
        }
      });
      
      // Enviar el mensaje a todos los clientes conectados
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      console.error('Error al obtener información del artista:', error);
    }
  }
};

app.broadcastStatusUpdate = async (offerId: number, responseId: number, status: string) => {
  const connections = offerConnections.get(offerId);
  if (connections) {
    try {
      // Crear el mensaje de actualización de estado
      const message = JSON.stringify({
        type: 'statusUpdate',
        offerId: offerId,
        responseId: responseId,
        status: status,
        timestamp: new Date().toISOString()
      });
      
      // Enviar el mensaje a todos los clientes conectados
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      console.error('Error al enviar actualización de estado:', error);
    }
  }
};

// Configuración de middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('Origen de la solicitud:', origin); // Log para depuración
    // Permitir solicitudes sin 'origin' (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está permitido (comparación flexible)
    const isAllowed = allowedOrigins.some((allowedOrigin: string) => {
      if (!allowedOrigin) return false;
      const cleanOrigin = allowedOrigin.replace(/^https?:\/\//, '');
      return origin.startsWith(cleanOrigin) || origin.endsWith(cleanOrigin);
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Origen no permitido
    console.warn('Origen no permitido:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Permitir cookies en las peticiones cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Middleware para registrar solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de healthcheck
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await db.execute('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'No se pudo conectar a la base de datos'
    });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5001;
httpServer.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`✅ Servidor iniciado en el puerto ${PORT}`);
  console.log(`📚 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Healthcheck en http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}/ws`);
  console.log('ℹ️  Las migraciones están desactivadas temporalmente');
});

export { httpServer as server };

// Manejo de cierre de la aplicación
process.on('SIGTERM', () => {
  console.log('🚦 Recibida señal SIGTERM. Cerrando servidor...');
  httpServer.close(() => {
    console.log('👋 Servidor cerrado');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Cerrar la aplicación para que el proceso de gestión la reinicie
  process.exit(1);
});
