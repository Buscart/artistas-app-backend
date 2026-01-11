import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service.js';
import { UserWithId } from '../types/user.types.js';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;
    }
  }
}

export class PostsController {
  /**
   * Obtiene todos los posts con paginación y filtrado
   */
  static async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '10', offset = '0', type, followingOnly, category } = req.query;
      const userId = req.user?.id;

      const result = await PostService.getAllPosts(
        parseInt(limit as string),
        parseInt(offset as string),
        type as 'post' | 'nota' | 'blog' | undefined,
        userId,
        followingOnly === 'true',
        category as string | undefined
      );

      res.json(result);
    } catch (error) {
      console.error('Error en PostsController.getPosts:', error);
      next(error);
    }
  }

  /**
   * Obtiene un post por su ID
   */
  static async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID de post no válido' });
      }

      const post = await PostService.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: 'Post no encontrado' });
      }

      res.json(post);
    } catch (error) {
      console.error('Error en PostsController.getPostById:', error);
      next(error);
    }
  }

  /**
   * Obtiene posts de un usuario específico
   */
  static async getUserPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { limit = '10', offset = '0' } = req.query;

      const posts = await PostService.getPostsByUser(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json({ data: posts });
    } catch (error) {
      console.error('Error en PostsController.getUserPosts:', error);
      next(error);
    }
  }

  /**
   * Crea un nuevo post
   */
  static async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      const { content, type, isPublic } = req.body;
      
      // Validaciones básicas
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'El contenido del post es requerido' });
      }

      if (content.length > 10000) {
        return res.status(400).json({ message: 'El contenido no puede exceder 10000 caracteres' });
      }

      // El middleware de multer ya procesó los archivos, los pasamos al servicio
      const uploadedFiles = req.files as Express.Multer.File[] || [];
      
      // Importar uploadMediaFiles aquí para evitar dependencia circular
      const { uploadMediaFiles } = await import('../services/storage.service.js');
      const mediaFiles = await uploadMediaFiles(uploadedFiles, 'posts', userId);

      const post = await PostService.createPost(
        {
          content: content.trim(),
          type: type || 'post',
          isPublic: isPublic !== 'false', // Default true
          authorId: userId,
        },
        mediaFiles
      );

      res.status(201).json(post);
    } catch (error) {
      console.error('Error en PostsController.createPost:', error);
      next(error);
    }
  }

  /**
   * Actualiza un post existente
   */
  static async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      const { content, type, isPublic } = req.body;

      // Validaciones
      if (content !== undefined) {
        if (content.trim().length === 0) {
          return res.status(400).json({ message: 'El contenido del post es requerido' });
        }
        if (content.length > 10000) {
          return res.status(400).json({ message: 'El contenido no puede exceder 10000 caracteres' });
        }
      }

      const updatedPost = await PostService.updatePost(postId, userId, {
        ...(content !== undefined && { content: content.trim() }),
        ...(type !== undefined && { type }),
        ...(isPublic !== undefined && { isPublic }),
      });
      
      if (!updatedPost) {
        return res.status(404).json({ message: 'Post no encontrado o no autorizado' });
      }

      // Obtener el post actualizado con relaciones
      const post = await PostService.getPostById(postId);
      res.json(post);
    } catch (error) {
      console.error('Error en PostsController.updatePost:', error);
      next(error);
    }
  }

  /**
   * Elimina un post
   */
  static async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      const result = await PostService.deletePost(postId, userId);
      
      if (!result) {
        return res.status(404).json({ message: 'Post no encontrado o no autorizado' });
      }

      res.json({ message: 'Post eliminado correctamente' });
    } catch (error) {
      console.error('Error en PostsController.deletePost:', error);
      next(error);
    }
  }

  /**
   * Agrega medios a un post existente
   */
  static async addMediaToPost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      const uploadedFiles = req.files as Express.Multer.File[] || [];
      
      const { uploadMediaFiles } = await import('../services/storage.service.js');
      const mediaFiles = await uploadMediaFiles(uploadedFiles, 'posts');

      const result = await PostService.addMediaToPost(postId, userId, mediaFiles);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error en PostsController.addMediaToPost:', error);
      next(error);
    }
  }

  /**
   * Da like a un post
   */
  static async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      await PostService.likePost(postId, userId);
      res.json({ message: 'Like agregado correctamente' });
    } catch (error) {
      console.error('Error en PostsController.likePost:', error);
      next(error);
    }
  }

  /**
   * Quita el like de un post
   */
  static async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      await PostService.unlikePost(postId, userId);
      res.json({ message: 'Like eliminado correctamente' });
    } catch (error) {
      console.error('Error en PostsController.unlikePost:', error);
      next(error);
    }
  }

  /**
   * Comparte un post
   */
  static async sharePost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      const { content } = req.body;
      
      // Validar contenido si se proporciona
      if (content && content.length > 1000) {
        return res.status(400).json({ message: 'El contenido de la compartida no puede exceder 1000 caracteres' });
      }

      const sharedPost = await PostService.sharePost(postId, userId, content);
      res.status(201).json(sharedPost);
    } catch (error) {
      console.error('Error en PostsController.sharePost:', error);
      next(error);
    }
  }

  /**
   * Obtiene los comentarios de un post
   */
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);

      if (isNaN(postId)) {
        return res.status(400).json({ message: 'ID de post no válido' });
      }

      const comments = await PostService.getComments(postId);
      res.json({ comments });
    } catch (error) {
      console.error('Error en PostsController.getComments:', error);
      next(error);
    }
  }

  /**
   * Crea un comentario en un post
   */
  static async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido o no autorizado' });
      }

      const { content, parentId, images, mentions, taggedArtists, taggedEvents, poll } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'El contenido del comentario es requerido' });
      }

      if (content.length > 2000) {
        return res.status(400).json({ message: 'El comentario no puede exceder 2000 caracteres' });
      }

      // Validar imágenes si se proporcionan
      if (images && (!Array.isArray(images) || images.length > 4)) {
        return res.status(400).json({ message: 'Máximo 4 imágenes por comentario' });
      }

      // Validar poll si se proporciona
      if (poll) {
        if (!poll.question || !poll.options || !Array.isArray(poll.options)) {
          return res.status(400).json({ message: 'Formato de encuesta inválido' });
        }
        if (poll.options.length < 2 || poll.options.length > 4) {
          return res.status(400).json({ message: 'La encuesta debe tener entre 2 y 4 opciones' });
        }
      }

      const comment = await PostService.createComment(
        postId,
        userId,
        content.trim(),
        parentId,
        images,
        mentions,
        taggedArtists,
        taggedEvents,
        poll
      );
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error en PostsController.createComment:', error);
      next(error);
    }
  }

  /**
   * Da like a un comentario
   */
  static async likeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user?.id;

      if (isNaN(commentId) || !userId) {
        return res.status(400).json({ message: 'ID de comentario no válido o no autorizado' });
      }

      await PostService.likeComment(commentId, userId);
      res.json({ message: 'Like agregado al comentario' });
    } catch (error) {
      console.error('Error en PostsController.likeComment:', error);
      next(error);
    }
  }

  /**
   * Quita el like de un comentario
   */
  static async unlikeComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user?.id;

      if (isNaN(commentId) || !userId) {
        return res.status(400).json({ message: 'ID de comentario no válido o no autorizado' });
      }

      await PostService.unlikeComment(commentId, userId);
      res.json({ message: 'Like eliminado del comentario' });
    } catch (error) {
      console.error('Error en PostsController.unlikeComment:', error);
      next(error);
    }
  }
}
