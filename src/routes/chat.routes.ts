// src/routes/chat.routes.ts
import { Router } from 'express';
import { sendChatNotification } from '../controllers/chat.controller.js';

const router = Router();

// POST /api/v1/chat/notify — envía notificación FCM al destinatario
router.post('/notify', sendChatNotification);

export default router;
