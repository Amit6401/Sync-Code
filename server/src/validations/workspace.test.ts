import { describe, it, expect } from 'vitest';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from './workspace';

describe('workspace validations', () => {
  describe('createWorkspaceSchema', () => {
    it('accepts a valid payload', () => {
      const r = createWorkspaceSchema.parse({ name: 'My WS', template: 'node' });
      expect(r.name).toBe('My WS');
      expect(r.template).toBe('node');
    });

    it('rejects a too-short name', () => {
      expect(createWorkspaceSchema.safeParse({ name: 'a' }).success).toBe(false);
    });

    it('allows template to be omitted', () => {
      expect(createWorkspaceSchema.safeParse({ name: 'Valid' }).success).toBe(true);
    });
  });

  describe('updateWorkspaceSchema', () => {
    it('accepts partial updates', () => {
      expect(updateWorkspaceSchema.safeParse({ description: 'hi' }).success).toBe(true);
      expect(updateWorkspaceSchema.safeParse({ name: 'Renamed' }).success).toBe(true);
      expect(updateWorkspaceSchema.safeParse({}).success).toBe(true);
    });

    it('rejects a short name when provided', () => {
      expect(updateWorkspaceSchema.safeParse({ name: 'x' }).success).toBe(false);
    });
  });

  describe('addMemberSchema', () => {
    it('validates email + role', () => {
      expect(addMemberSchema.safeParse({ email: 'a@b.com', role: 'editor' }).success).toBe(true);
      expect(addMemberSchema.safeParse({ email: 'nope', role: 'editor' }).success).toBe(false);
      expect(addMemberSchema.safeParse({ email: 'a@b.com', role: 'admin' }).success).toBe(false);
    });
  });

  describe('updateMemberRoleSchema', () => {
    it('only allows editor or viewer', () => {
      expect(updateMemberRoleSchema.safeParse({ role: 'editor' }).success).toBe(true);
      expect(updateMemberRoleSchema.safeParse({ role: 'viewer' }).success).toBe(true);
      expect(updateMemberRoleSchema.safeParse({ role: 'owner' }).success).toBe(false);
    });
  });
});
