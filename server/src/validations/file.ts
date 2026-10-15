import { z } from 'zod';

export const createFileSchema = z.object({
  name: z.string().min(1),
  isDirectory: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  language: z.string().optional(),
  content: z.string().optional(),
});
