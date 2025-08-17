import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import type { RequestHandler } from 'express';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { Express } from 'express';
import { sql } from 'drizzle-orm';
import apiRoutes from './routes/api.routes.js';
import { db, dbReady } from './db.js';
import { storage } from './storage/index.js';
import { auth } from './config/firebase.js';
import { URL } from 'url';

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

// (El manejador de errores se declara más abajo, después de las rutas)

// Configuración de CORS endurecida
const isDev = process.env.NODE_ENV === 'development';
const frontendUrl = process.env.FRONTEND_URL || '';
const devOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]);

const offerConnections = new Map<number, Set<WebSocket>>();

wss.on('connection', async (ws, req) => {
  try {
    // Extraer token del query ?token= o del header Authorization: Bearer XXX
    const urlObj = new URL(req.url || '', 'http://localhost');
    const queryToken = urlObj.searchParams.get('token') || '';
    const headerAuth = (req.headers['authorization'] || '').toString();
    const headerToken = headerAuth.startsWith('Bearer ')
      ? headerAuth.substring('Bearer '.length)
      : '';
    const token = queryToken || headerToken;

    if (!token) {
      if (process.env.NODE_ENV === 'development') console.warn('WS sin token, cerrando');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Verificar token con Firebase Admin
    const decoded = await auth.verifyIdToken(token);
    (ws as any).userId = decoded.uid;
  } catch (e) {
    console.warn('WS auth failed:', (e as Error).message);
    ws.close(1008, 'Unauthorized');
    return;
  }

  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe' && data.offerId !== undefined) {
        const offerId = parseInt(String(data.offerId));
        if (Number.isNaN(offerId) || offerId <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'offerId inválido' }));
          return;
        }
        
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
        id: artist.artist.id,
        artistName: artist.artist.artistName,
        userId: artist.user.id,
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
app.use(helmet());
app.use(compression() as unknown as RequestHandler);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin o apps nativas

    // En desarrollo: permitir orígenes locales conocidos
    if (isDev && devOrigins.has(origin)) return callback(null, true);

    // En producción: permitir solo FRONTEND_URL exacta
    if (!isDev && frontendUrl && origin === frontendUrl) return callback(null, true);

    console.warn('Origen no permitido:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // máximo 300 solicitudes por IP/ventana
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 30, // rutas sensibles (login/refresh)
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware para registrar solicitudes (solo en desarrollo)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const redactedHeaders = { ...req.headers, authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined };
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', redactedHeaders);
    console.log('Body:', req.body);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos desde la carpeta uploads
// Archivos estáticos locales eliminados: ahora los medios se sirven desde Supabase Storage

// Aplicar rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Rutas de la API
app.use('/api', apiRoutes);

// Ruta de healthcheck
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'not_configured';
    if (dbReady && db) {
      // Verificar conexión a la base de datos si está configurada
      await db.execute(sql`select 1`);
      dbStatus = 'connected';
    }
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: dbReady ? 'disconnected' : 'not_configured',
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
