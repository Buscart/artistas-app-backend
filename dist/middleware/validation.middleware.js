import { z } from 'zod';
export function validateRequest(schema, type = 'body') {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req[type]);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    errors: result.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
            }
            // Reemplazar los datos validados en el request
            req[type] = result.data;
            return next();
        }
        catch (error) {
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
        page: z.preprocess((val) => (typeof val === 'string' ? parseInt(val, 10) : val), z.number().int().positive().default(1)),
        limit: z.preprocess((val) => (typeof val === 'string' ? parseInt(val, 10) : val), z.number().int().positive().max(100).default(10)),
    }),
    idParam: z.object({
        id: z.preprocess((val) => (typeof val === 'string' ? parseInt(val, 10) : val), z.number().int().positive()),
    }),
};
export default {
    validateRequest,
    ...validationSchemas,
};
