import { Request, Response } from 'express';
import { storage } from '../storage/index.js';

export const userController = {
  async getProfile(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      return res.json(user);
    } catch (e) {
      console.error('getProfile error:', e);
      return res.status(500).json({ message: 'Error al obtener el perfil' });
    }
  },

  async updateUserType(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      const { userType } = req.body || {};
      const allowed = ['general', 'artist', 'company'];
      if (!allowed.includes(userType)) {
        return res.status(400).json({ message: 'userType inválido' });
      }
      const updated = await storage.upsertUser({ id: userId, userType });
      return res.json(updated);
    } catch (e) {
      console.error('updateUserType error:', e);
      return res.status(500).json({ message: 'Error al actualizar el tipo de usuario' });
    }
  },

  async updateProfile(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      const {
        email,
        firstName,
        lastName,
        profileImageUrl,
        bio,
        city,
        isVerified,
        userType,
      } = req.body || {};

      // Validar userType opcionalmente
      let safeUserType: 'general' | 'artist' | 'company' | undefined = undefined as any;
      if (userType !== undefined) {
        const allowed = ['general', 'artist', 'company'];
        if (!allowed.includes(userType)) {
          return res.status(400).json({ message: 'userType inválido' });
        }
        safeUserType = userType;
      }

      const updated = await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        profileImageUrl: profileImageUrl ?? null,
        bio: bio ?? null,
        city: city ?? null,
        isVerified: isVerified ?? undefined,
        userType: safeUserType,
      });
      return res.json(updated);
    } catch (e) {
      console.error('updateProfile error:', e);
      return res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
  },

  async getPublicProfile(req: any, res: Response) {
    try {
      const userId = req.params.userId || req.params.id;
      if (!userId) return res.status(400).json({ message: 'userId requerido' });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      return res.json(user);
    } catch (e) {
      console.error('getPublicProfile error:', e);
      return res.status(500).json({ message: 'Error al obtener el perfil público' });
    }
  }
};
