import type { Database } from '../types/db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';

export class UserStorage {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user;
  }

  async getUsers(filters: { 
    userType?: 'general' | 'artist' | 'company' 
  }): Promise<typeof users.$inferSelect[]> {
    const query = this.db.select().from(users);
    
    if (filters.userType) {
      return await query.where(eq(users.userType, filters.userType));
    }
    
    return await query;
  }

  async upsertUser(userData: { 
    id: string; 
    email?: string; 
    firstName?: string; 
    lastName?: string; 
    profileImageUrl?: string | null; 
    userType?: 'general' | 'artist' | 'company'; 
    bio?: string | null; 
    city?: string | null; 
    isVerified?: boolean;
  }): Promise<typeof users.$inferSelect> {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userData.id));

    const now = new Date();
    
    // Función auxiliar para limpiar los datos
    const prepareData = () => {
      const data: Record<string, any> = {};
      
      // Solo agregar los campos que vienen en userData
      if ('email' in userData) data.email = userData.email || '';
      if ('firstName' in userData) data.firstName = userData.firstName || '';
      if ('lastName' in userData) data.lastName = userData.lastName || '';
      if ('profileImageUrl' in userData) data.profileImageUrl = userData.profileImageUrl;
      if ('userType' in userData) data.userType = userData.userType || 'general';
      if ('bio' in userData) data.bio = userData.bio;
      if ('city' in userData) data.city = userData.city;
      if ('isVerified' in userData) data.isVerified = userData.isVerified ?? false;
      
      return data;
    };

    if (existingUser) {
      // Actualizar usuario existente
      const updateData = prepareData();
      updateData.updatedAt = now;
      
      const [updatedUser] = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userData.id))
        .returning();
      
      return updatedUser;
    }

    // Crear nuevo usuario
    const insertData = {
      id: userData.id,
      email: userData.email || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      profileImageUrl: userData.profileImageUrl ?? null,
      userType: userData.userType || 'general',
      bio: userData.bio ?? null,
      city: userData.city ?? null,
      isVerified: userData.isVerified ?? false,
      createdAt: now,
      updatedAt: now
    };

    const [newUser] = await this.db
      .insert(users)
      .values(insertData)
      .returning();
    
    return newUser;
  }
}
