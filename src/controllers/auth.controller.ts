
import { Request, Response } from 'express';
import { authenticateUser } from '../services/auth.service';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const token = await authenticateUser(req.body);
      res.json({ token });
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  },

  async getUser(req: Request, res: Response) {
    res.json(req.user);
  }
};
