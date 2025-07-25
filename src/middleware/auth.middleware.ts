import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm/sql';

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

// Extender la interfaz Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;  // ✅ usa 'id', no '_id'
        email: string;
        userType: 'artist' | 'general' | 'company';
        [key: string]: any;
      };
      decodedToken?: DecodedIdToken | CustomDecodedToken;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Iniciando autenticación...');

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ No se proporcionó el encabezado de autorización');
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó el token de autenticación'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Formato de token inválido');
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido. Use Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('❌ Token no proporcionado');
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    console.log('🔑 Verificando token con Firebase...');

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

      req.user = {
        id,  // ✅ CORRECTO: se expone como 'id'
        email,
        userType: userType as 'artist' | 'general' | 'company',
        ...rest
      };

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
