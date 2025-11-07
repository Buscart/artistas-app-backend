import express from 'express';
import {
  getTicketTypes,
  getTicketType,
  createTicketType,
  createBulkTicketTypes,
  updateTicketType,
  deleteTicketType,
  getTicketStats,
} from '../controllers/ticketTypes.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :eventId from parent router

// Public routes - anyone can view ticket types
router.get('/', getTicketTypes);
router.get('/stats', getTicketStats);
router.get('/:id', getTicketType);

// Protected routes - require authentication
router.post('/', authMiddleware, createTicketType);
router.post('/bulk', authMiddleware, createBulkTicketTypes);
router.put('/:id', authMiddleware, updateTicketType);
router.delete('/:id', authMiddleware, deleteTicketType);

export default router;
