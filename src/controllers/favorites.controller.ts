import { Request, Response } from 'express';
import { favoritesService } from '../services/favorites.service.js';

export const favoritesController = {
  addFavorite: async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { type, id } = req.body;
    const favorite = await favoritesService.addFavorite(userId, type, id);
    res.status(201).json(favorite);
  },

  removeFavorite: async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { type, id } = req.params;
    await favoritesService.removeFavorite(userId, type, parseInt(id));
    res.status(204).send();
  },

  getFavorites: async (req: Request, res: Response) => {
    const userId = req.user.id;
    const favorites = await favoritesService.getFavorites(userId);
    res.status(200).json(favorites);
  },
};
