import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  validateCart,
  checkoutCart,
} from '../controllers/cart.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get user's active shopping cart
 *     description: Returns the authenticated user's active cart with all items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           item_type:
 *                             type: string
 *                             enum: [service, product, event, booking]
 *                           item_id:
 *                             type: integer
 *                           quantity:
 *                             type: integer
 *                           price:
 *                             type: number
 *                           metadata:
 *                             type: object
 *                     total:
 *                       type: number
 *                     itemsCount:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/cart', authMiddleware, getCart);

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: Add item to cart
 *     description: Adds a new item to the user's cart or updates quantity if already exists
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemType
 *               - itemId
 *               - price
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [service, product, event, booking]
 *                 description: Type of item to add
 *               itemId:
 *                 type: integer
 *                 description: ID of the item
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Quantity to add
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per unit
 *               metadata:
 *                 type: object
 *                 description: Additional data (date, duration, size, etc.)
 *           examples:
 *             service:
 *               value:
 *                 itemType: service
 *                 itemId: 123
 *                 quantity: 1
 *                 price: 250000
 *                 metadata:
 *                   duration: "2 hours"
 *                   date: "2025-02-15"
 *                   artistName: "Carlos Rodríguez"
 *             product:
 *               value:
 *                 itemType: product
 *                 itemId: 456
 *                 quantity: 2
 *                 price: 45000
 *                 metadata:
 *                   size: "M"
 *                   color: "blue"
 *             event:
 *               value:
 *                 itemType: event
 *                 itemId: 789
 *                 quantity: 2
 *                 price: 85000
 *                 metadata:
 *                   ticketType: "VIP"
 *                   eventDate: "2025-03-20"
 *                   eventName: "Concierto de Jazz"
 *     responses:
 *       200:
 *         description: Item added successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cart/items', authMiddleware, addItemToCart);

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     description: Updates the quantity of a specific item in the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.put('/cart/items/:itemId', authMiddleware, updateCartItem);

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Removes a specific item from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete('/cart/items/:itemId', authMiddleware, removeCartItem);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear cart
 *     description: Removes all items from the user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/cart', authMiddleware, clearCart);

/**
 * @swagger
 * /api/v1/cart/validate:
 *   post:
 *     summary: Validate cart
 *     description: Validates cart items availability and prices
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart validated
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
 *                     valid:
 *                       type: boolean
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itemId:
 *                             type: integer
 *                           valid:
 *                             type: boolean
 *                           available:
 *                             type: boolean
 *                           priceChanged:
 *                             type: boolean
 *                     cart:
 *                       type: object
 *       400:
 *         description: Cart is empty
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cart/validate', authMiddleware, validateCart);

/**
 * @swagger
 * /api/v1/cart/checkout:
 *   post:
 *     summary: Checkout cart
 *     description: Initiates checkout process for the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *               phone:
 *                 type: string
 *                 description: Contact phone (optional)
 *               notes:
 *                 type: string
 *                 description: Additional notes (optional)
 *               paymentMethod:
 *                 type: string
 *                 enum: [mercado_pago, credit_card, pse, cash, other]
 *                 default: mercado_pago
 *               promoCode:
 *                 type: string
 *                 description: Promotional code (optional)
 *     responses:
 *       200:
 *         description: Checkout initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutId:
 *                       type: integer
 *                     total:
 *                       type: number
 *                     itemsCount:
 *                       type: integer
 *                     paymentMethod:
 *                       type: string
 *                     paymentUrl:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid data or empty cart
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/cart/checkout', authMiddleware, checkoutCart);

export default router;
