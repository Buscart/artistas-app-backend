import { Request, Response } from 'express';
import { dislikedItemsService } from '../services/dislikedItems.service.js';

export const dislikedItemsController = {
  /**
   * Añadir un item a "no me interesa"
   */
  addDislikedItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { type, id } = req.body;

      if (!type || !id) {
        return res.status(400).json({
          success: false,
          message: 'Tipo e ID son requeridos',
        });
      }

      const dislikedItem = await dislikedItemsService.addDislikedItem(userId, type, id);

      res.status(201).json({
        success: true,
        message: 'Item añadido a "no me interesa"',
        data: dislikedItem,
      });
    } catch (error) {
      console.error('Error al añadir item a "no me interesa":', error);
      res.status(500).json({
        success: false,
        message: 'Error al añadir item',
      });
    }
  },

  /**
   * Eliminar un item de "no me interesa"
   */
  removeDislikedItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { type, id } = req.params;

      await dislikedItemsService.removeDislikedItem(userId, type, parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Item eliminado de "no me interesa"',
      });
    } catch (error) {
      console.error('Error al eliminar item de "no me interesa":', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar item',
      });
    }
  },

  /**
   * Obtener todos los items de "no me interesa" del usuario
   */
  getDislikedItems: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const dislikedItems = await dislikedItemsService.getDislikedItems(userId);

      res.status(200).json({
        success: true,
        data: dislikedItems,
        count: dislikedItems.length,
      });
    } catch (error) {
      console.error('Error al obtener items de "no me interesa":', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener items',
      });
    }
  },
};
