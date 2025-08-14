import { categories } from '../schema.js';
import { db } from '../db.js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class CategoryStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  async getCategories() {
    return await this.db.select().from(categories);
  }

  async createCategory(category: Omit<typeof categories.$inferInsert, 'id'>) {
    const [result] = await this.db.insert(categories).values(category).returning();
    return result;
  }
}

export const categoryStorage = new CategoryStorage(db);
