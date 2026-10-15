import { Router } from 'express';
import authRoutes from './authRoutes';
import workspaceRoutes from './workspaceRoutes';
import fileRoutes from './fileRoutes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/files', fileRoutes);

export default router;
