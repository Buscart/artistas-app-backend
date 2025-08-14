import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm/sql';
import type { User, UserWithId } from '../types/user.types.js';

// Importar la definición de tipos de Express para extender Request
import '../types/express/index.d.js';

// Declarar el módulo para extender el espacio de nombres de Express
declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;  // Usamos UserWithId de user.types.ts
      decodedToken?: DecodedIdToken | { [key: string]: any };
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[] | undefined;
    }
  }
}

interface CustomDecodedToken {
  uid: string;
  email: string;
  iat: number;
  exp: number;
  aud?: string;
  iss?: string;
  sub?: string;
  auth_time?: number;
  firebase?: any;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Iniciando autenticación...');
    console.log('🔍 URL de la solicitud:', req.originalUrl);
    console.log('🔍 Método de la solicitud:', req.method);
    console.log('🔍 Headers recibidos:', JSON.stringify(req.headers, null, 2));

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ No se proporcionó el encabezado de autorización');
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó el token de autenticación',
        details: 'El encabezado Authorization es requerido'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Formato de token inválido');
      console.error('❌ Formato esperado: "Bearer [token]"');
      console.error('❌ Formato recibido:', authHeader ? `"${authHeader.substring(0, 20)}..."` : 'undefined');
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido',
        details: 'Use el formato: Bearer [token]'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('❌ Token no proporcionado después de split');
      console.error('❌ authHeader completo:', authHeader);
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
        details: 'El token no se pudo extraer del encabezado Authorization'
      });
    }

    console.log('🔑 Token extraído (primeros 10 caracteres):', token.substring(0, 10) + '...');
    console.log('🔑 Longitud del token:', token.length);
    console.log('🔑 Verificando token con Firebase...');
    
    // Verificar si el token parece ser un token JWT
    const jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
      console.error('❌ El token no parece ser un JWT válido');
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        details: 'El formato del token no es un JWT válido'
      });
    }

    let decodedToken: DecodedIdToken | CustomDecodedToken;

    try {
      const decodedTokenResult = await auth.verifyIdToken(token, true);
      const userRecord = await auth.getUser(decodedTokenResult.uid);

      decodedToken = {
        uid: userRecord.uid,
        email: userRecord.email || '',
        iat: decodedTokenResult.iat || Math.floor(Date.now() / 1000),
        exp: decodedTokenResult.exp || Math.floor(Date.now() / 1000) + 3600,
        aud: decodedTokenResult.aud || process.env.FIREBASE_PROJECT_ID,
        iss: decodedTokenResult.iss || `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
        sub: decodedTokenResult.sub || userRecord.uid,
        auth_time: decodedTokenResult.auth_time || Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: userRecord.providerData[0]?.providerId || 'unknown'
        }
      };

      console.log('✅ Token verificado para:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider: decodedToken.firebase.sign_in_provider
      });

    } catch (error: any) {
      console.error('❌ Error al verificar token:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    req.decodedToken = decodedToken;

    console.log('🔍 Buscando usuario en DB:', decodedToken.uid);

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedToken.uid))
        .limit(1);

      if (!user) {
        console.error('❌ Usuario no encontrado:', decodedToken.uid);
        return res.status(404).json({
          success: false,
          error: 'Usuario no registrado',
          code: 'USER_NOT_FOUND'
        });
      }

      const { id, email, userType, ...rest } = user;

      // Usando type assertion para resolver temporalmente el conflicto de tipos
      req.user = {
        id,
        email,
        userType: userType as 'artist' | 'general' | 'company',
        ...rest
      } as UserWithId;

      console.log('✅ Usuario autenticado:', req.user);

      next();
    } catch (dbError: any) {
      console.error('❌ Error DB auth:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Error interno en auth',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err: any) {
    console.error('❌ Error global en middleware auth:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error interno',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
