import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { requireWorkspaceRole } from '../middlewares/requireWorkspaceRole';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
  updateWorkspace,
  deleteWorkspace,
  getTemplates,
} from '../controllers/workspaceController';

const router = Router();
router.use(protect);
router.get('/templates', getTemplates);
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:workspaceId', requireWorkspaceRole(['owner','editor','viewer']), getWorkspace);
router.patch('/:workspaceId', requireWorkspaceRole(['owner']), updateWorkspace);
router.delete('/:workspaceId', requireWorkspaceRole(['owner']), deleteWorkspace);
router.post('/:workspaceId/members', requireWorkspaceRole(['owner']), addMember);
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole(['owner']), updateMemberRole);
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole(['owner']), removeMember);

export default router;
