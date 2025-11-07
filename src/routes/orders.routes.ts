import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createOrder, getUserOrders } from '../controllers/order.controller.js';

const router = Router();

/**
 * @swagger
 * /api/v1/events/{eventId}/orders:
 *   post:
 *     summary: Crear una nueva orden de compra
 *     description: Crea una nueva orden de compra para un evento específico
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketTypeId
 *               - quantity
 *               - customerInfo
 *               - paymentMethod
 *             properties:
 *               ticketTypeId:
 *                 type: integer
 *                 description: ID del tipo de entrada
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Cantidad de entradas a comprar
 *               customerInfo:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Nombre del comprador
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Correo electrónico del comprador
 *                   phone:
 *                     type: string
 *                     description: Teléfono del comprador (opcional)
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, pse, cash, other]
 *                 description: Método de pago
 *               paymentDetails:
 *                 type: object
 *                 description: Detalles del pago (depende del método de pago)
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     total:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           code:
 *                             type: string
 *                           ticketType:
 *                             type: string
 *                           event:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               title:
 *                                 type: string
 *                               date:
 *                                 type: string
 *                               location:
 *                                 type: string
 *       400:
 *         description: Datos de entrada inválidos o insuficientes entradas disponibles
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Evento o tipo de entrada no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/events/:eventId/orders', authMiddleware, createOrder);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Obtener las órdenes del usuario autenticado
 *     description: Retorna todas las órdenes del usuario autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/orders', authMiddleware, getUserOrders);

export default router;
