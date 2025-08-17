import { Response } from 'express';

// Stub temporal: funcionalidades de venues deshabilitadas por modelos ausentes
export const venueController = {
  async getAll(req: any, res: Response) {
    return res.status(501).json({ message: 'Venue: no implementado temporalmente' });
  },

  async getById(req: any, res: Response) {
    return res.status(501).json({ message: 'Venue: no implementado temporalmente' });
  }
};
