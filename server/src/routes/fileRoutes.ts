import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { requireWorkspaceRole } from '../middlewares/requireWorkspaceRole';
import { getFiles, createFile, updateFile, deleteFile } from '../controllers/fileController';

const router = Router({ mergeParams: true });
router.use(protect);
router.get('/', requireWorkspaceRole(['owner','editor','viewer']), getFiles);
router.post('/', requireWorkspaceRole(['owner','editor']), createFile);
router.patch('/:fileId', requireWorkspaceRole(['owner','editor']), updateFile);
router.delete('/:fileId', requireWorkspaceRole(['owner','editor']), deleteFile);

export default router;
