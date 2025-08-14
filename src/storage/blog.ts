import { db } from '../db.js';
import { blogPosts, users } from '../schema.js';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type BlogPostWithAuthor = typeof blogPosts.$inferSelect & {
  author: typeof users.$inferSelect;
};

export class BlogStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  private async getBlogPostQuery(id?: number, filters?: { 
    authorId?: string; 
    category?: string; 
    visibility?: 'draft' | 'public' | 'private'; 
    search?: string; 
  }) {
    const authorAlias = alias(users, 'author');
    
    const query = this.db
      .select({
        // Select all blog post fields
        ...Object.fromEntries(
          Object.entries(blogPosts).map(([key, value]) => [key, blogPosts[key as keyof typeof blogPosts]])
        ),
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
        conditions.push(
          or(
            like(blogPosts.title, `%${filters.search}%`),
            like(blogPosts.content, `%${filters.search}%`),
            sql`${blogPosts.tags}::text ILIKE ${`%${filters.search}%`}`
          )
        );
      }
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
    }

    return query;
  }

  async getBlogPosts(filters: { 
    authorId?: string; 
    category?: string; 
    visibility?: 'draft' | 'public' | 'private'; 
    search?: string;
  } = {}): Promise<BlogPostWithAuthor[]> {
    const posts = await this.getBlogPostQuery(undefined, filters);
    return posts as unknown as BlogPostWithAuthor[];
  }

  async getBlogPost(id: number): Promise<BlogPostWithAuthor | undefined> {
    const [post] = await this.getBlogPostQuery(id);
    return post as unknown as BlogPostWithAuthor | undefined;
  }

  async createBlogPost(
    post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<typeof blogPosts.$inferSelect> {
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

  async updateBlogPost(
    id: number, 
    data: Partial<typeof blogPosts.$inferInsert>
  ): Promise<typeof blogPosts.$inferSelect> {
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

  async deleteBlogPost(id: number): Promise<void> {
    await this.db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));
  }
}

export const blogStorage = new BlogStorage(db);
