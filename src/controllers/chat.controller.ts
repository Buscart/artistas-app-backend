// src/controllers/chat.controller.ts
// Endpoint para enviar notificaciones FCM cuando el destinatario tiene la app cerrada.
// Requiere Firebase Admin SDK (ya configurado en .env).

import { Request, Response } from 'express';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Inicializar Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Cliente Supabase para leer tokens FCM
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/v1/chat/notify
 * Envía una notificación push al destinatario de un mensaje nuevo.
 * Body: { recipientId, senderName, messagePreview, contractId, contractTitle }
 */
export const sendChatNotification = async (req: Request, res: Response) => {
  try {
    const { recipientId, senderName, messagePreview, contractId, contractTitle } = req.body;

    if (!recipientId || !senderName || !messagePreview) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }

    // Obtener token FCM del destinatario desde Supabase
    const { data: tokenRow } = await supabase
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', recipientId)
      .maybeSingle();

    if (!tokenRow?.token) {
      // El usuario no tiene token FCM registrado (app nunca abierta o permisos denegados)
      return res.json({ success: true, sent: false, reason: 'no_token' });
    }

    // Enviar notificación via Firebase Admin SDK
    await admin.messaging().send({
      token: tokenRow.token,
      notification: {
        title: senderName,
        body: messagePreview.length > 80 ? messagePreview.substring(0, 80) + '...' : messagePreview,
      },
      data: {
        type: 'chat_message',
        contractId: contractId ?? '',
        contractTitle: contractTitle ?? '',
      },
      android: {
        channelId: 'chat',
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    res.json({ success: true, sent: true });
  } catch (error) {
    console.error('Error enviando notificación FCM:', error);
    res.status(500).json({ success: false, error: 'Error al enviar la notificación' });
  }
};
