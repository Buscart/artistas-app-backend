import { db } from '../db.js';
import { blogPosts, users } from '../schema.js';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
export class BlogStorage {
    constructor(db) {
        this.db = db;
    }
    async getBlogPostQuery(id, filters) {
        const authorAlias = alias(users, 'author');
        const query = this.db
            .select({
            // Select all blog post fields
            ...Object.fromEntries(Object.entries(blogPosts).map(([key, value]) => [key, blogPosts[key]])),
            // Add author relation
            author: {
                id: authorAlias.id,
                email: authorAlias.email,
                firstName: authorAlias.firstName,
                lastName: authorAlias.lastName,
                profileImageUrl: authorAlias.profileImageUrl,
                userType: authorAlias.userType,
                isVerified: authorAlias.isVerified,
                createdAt: authorAlias.createdAt,
                updatedAt: authorAlias.updatedAt
            }
        })
            .from(blogPosts)
            .leftJoin(authorAlias, eq(blogPosts.authorId, authorAlias.id));
        if (id !== undefined) {
            return query.where(eq(blogPosts.id, id));
        }
        if (filters) {
            const conditions = [];
            if (filters.authorId) {
                conditions.push(eq(blogPosts.authorId, filters.authorId));
            }
            if (filters.category) {
                conditions.push(eq(blogPosts.category, filters.category));
            }
            if (filters.visibility) {
                conditions.push(eq(blogPosts.visibility, filters.visibility));
            }
            if (filters.search) {
                conditions.push(or(like(blogPosts.title, `%${filters.search}%`), like(blogPosts.content, `%${filters.search}%`), sql `${blogPosts.tags}::text ILIKE ${`%${filters.search}%`}`));
            }
            if (conditions.length > 0) {
                query.where(and(...conditions));
            }
        }
        return query;
    }
    async getBlogPosts(filters = {}) {
        const posts = await this.getBlogPostQuery(undefined, filters);
        return posts;
    }
    async getBlogPost(id) {
        const [post] = await this.getBlogPostQuery(id);
        return post;
    }
    async createBlogPost(post) {
        const slug = post.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
        const [created] = await this.db
            .insert(blogPosts)
            .values({
            ...post,
            slug,
            excerpt: post.content.substring(0, 200),
            tags: post.tags || [],
            category: post.category || null,
            visibility: post.visibility || 'draft',
            allowComments: post.allowComments ?? true,
            isFeatured: post.isFeatured ?? false,
            isVerified: post.isVerified ?? false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
            .returning();
        return created;
    }
    async updateBlogPost(id, data) {
        const [updated] = await this.db
            .update(blogPosts)
            .set({
            ...data,
            updatedAt: new Date()
        })
            .where(eq(blogPosts.id, id))
            .returning();
        if (!updated) {
            throw new Error(`Blog post with ID ${id} not found`);
        }
        return updated;
    }
    async deleteBlogPost(id) {
        await this.db
            .delete(blogPosts)
            .where(eq(blogPosts.id, id));
    }
}
export const blogStorage = new BlogStorage(db);
