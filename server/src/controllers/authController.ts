import { Response, Request } from 'express';
import { User, hashPassword, comparePassword } from '../models/User';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middlewares/asyncHandler';
import { loginSchema, registerSchema } from '../validations/auth';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new AppError('Email already exists', 409);
  }
  const user = await User.create({ ...data, password: await hashPassword(data.password) });
  const token = signToken(user._id.toString());
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email });
  if (!user || !(await comparePassword(data.password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }
  const token = signToken(user._id.toString());
  res.cookie('token', token, cookieOptions);
  res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export const me = asyncHandler(async (req: any, res: Response) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email } });
});
