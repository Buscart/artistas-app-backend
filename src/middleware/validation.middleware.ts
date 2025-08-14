import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';

export function validateRequest(schema: AnyZodObject, type: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req[type]);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      // Reemplazar los datos validados en el request
      req[type] = result.data;
      
      return next();
    } catch (error) {
      console.error('Error en el middleware de validación:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al validar la solicitud',
      });
    }
  };
}

// Esquemas de validación comunes
export const validationSchemas = {
  pagination: z.object({
    page: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().default(1)
    ),
    limit: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive().max(100).default(10)
    ),
  }),
  
  idParam: z.object({
    id: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().positive()
    ),
  }),
};

export default {
  validateRequest,
  ...validationSchemas,
};
