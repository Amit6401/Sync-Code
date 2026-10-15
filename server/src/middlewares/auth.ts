import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { AppError } from '../utils/appError';
import { asyncHandler } from './asyncHandler';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authenticated', 401);
  }

  const decoded = verifyToken(token);
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new AppError('User not found', 401);
  }
  req.user = user;
  next();
});
