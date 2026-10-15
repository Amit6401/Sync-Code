import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ZodError } from 'zod';

export const errorHandler = (err: Error | AppError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err instanceof ZodError) {
    const issues = (err as ZodError).issues || [];
    const message = issues.map((i) => i.message).join(', ');
    return res.status(400).json({ success: false, message: message || 'Validation failed' });
  }
  console.error('[ERROR]', err);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
};
