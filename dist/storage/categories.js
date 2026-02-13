import { categories } from '../schema.js';
import { db } from '../db.js';
export class CategoryStorage {
    constructor(db) {
        this.db = db;
    }
    async getCategories() {
        return await this.db.select().from(categories);
    }
    async createCategory(category) {
        const [result] = await this.db.insert(categories).values(category).returning();
        return result;
    }
}
export const categoryStorage = new CategoryStorage(db);
