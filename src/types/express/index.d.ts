import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { UserWithId } from '../../types/user.types.js';
import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;
      decodedToken?: DecodedIdToken | { [key: string]: any };
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[] | undefined;
    }

    interface Response {
      success: (data?: any, message?: string, statusCode?: number) => void;
      error: (message: string, statusCode?: number, error?: any) => void;
    }
  }
}

export {};
