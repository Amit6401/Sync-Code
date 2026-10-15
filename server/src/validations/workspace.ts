import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  template: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner','editor','viewer']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['editor','viewer']),
});
