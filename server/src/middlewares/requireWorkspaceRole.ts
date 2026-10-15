import { Response, NextFunction } from 'express';
import { Workspace } from '../models/Workspace';
import { AppError } from '../utils/appError';
import { asyncHandler } from './asyncHandler';
import { AuthRequest } from './auth';

export const requireWorkspaceRole = (allowed: ('owner'|'editor'|'viewer')[]) =>
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found', 404);
    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member && workspace.owner.toString() !== req.user._id.toString()) {
      throw new AppError('Not a member', 403);
    }
    const role = member ? member.role : 'owner';
    if (!allowed.includes(role)) throw new AppError('Permission denied', 403);
    (req as any).workspace = workspace;
    (req as any).role = role;
    next();
  });
