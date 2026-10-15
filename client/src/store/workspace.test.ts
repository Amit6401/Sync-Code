import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore, isReadOnly } from './workspace';
import type { Workspace, WorkspaceFile } from '../types';

const file = (over: Partial<WorkspaceFile>): WorkspaceFile => ({
  _id: 'f1',
  workspaceId: 'w1',
  name: 'index.js',
  path: '/index.js',
  language: 'javascript',
  content: '',
  parentId: null,
  isDirectory: false,
  createdBy: 'u1',
  ...over,
});

const workspace = (over: Partial<Workspace> = {}): Workspace => ({
  _id: 'w1',
  name: 'WS',
  owner: 'u1',
  members: [
    { user: 'u1', role: 'owner' },
    { user: 'u2', role: 'editor' },
    { user: 'u3', role: 'viewer' },
  ],
  ...over,
});

beforeEach(() => {
  useWorkspaceStore.setState({
    workspace: null,
    files: [],
    openTabs: [],
    activeFileId: null,
    myRole: null,
    online: [],
  });
});

describe('useWorkspaceStore', () => {
  describe('setWorkspace / role detection', () => {
    it('detects owner', () => {
      useWorkspaceStore.getState().setWorkspace(workspace(), 'u1');
      expect(useWorkspaceStore.getState().myRole).toBe('owner');
    });

    it('detects editor', () => {
      useWorkspaceStore.getState().setWorkspace(workspace(), 'u2');
      expect(useWorkspaceStore.getState().myRole).toBe('editor');
    });

    it('detects viewer', () => {
      useWorkspaceStore.getState().setWorkspace(workspace(), 'u3');
      expect(useWorkspaceStore.getState().myRole).toBe('viewer');
    });

    it('falls back to viewer for non-members', () => {
      useWorkspaceStore.getState().setWorkspace(workspace(), 'stranger');
      expect(useWorkspaceStore.getState().myRole).toBe('viewer');
    });

    it('works with populated owner/member objects', () => {
      const ws = workspace({
        owner: { _id: 'u1', name: 'Owner' },
        members: [
          { user: { _id: 'u1', name: 'Owner' }, role: 'owner' },
          { user: { _id: 'u2', name: 'Bob' }, role: 'editor' },
        ],
      });
      useWorkspaceStore.getState().setWorkspace(ws, 'u2');
      expect(useWorkspaceStore.getState().myRole).toBe('editor');
    });
  });

  describe('tabs', () => {
    it('opens a file and marks it active', () => {
      useWorkspaceStore.getState().openFile(file({}));
      expect(useWorkspaceStore.getState().openTabs).toEqual(['f1']);
      expect(useWorkspaceStore.getState().activeFileId).toBe('f1');
    });

    it('does not duplicate an already open tab', () => {
      useWorkspaceStore.getState().openFile(file({}));
      useWorkspaceStore.getState().openFile(file({}));
      expect(useWorkspaceStore.getState().openTabs).toEqual(['f1']);
    });

    it('closing the active tab activates the previous one', () => {
      useWorkspaceStore.getState().openFile(file({ _id: 'a' }));
      useWorkspaceStore.getState().openFile(file({ _id: 'b' }));
      useWorkspaceStore.getState().closeTab('b');
      expect(useWorkspaceStore.getState().openTabs).toEqual(['a']);
      expect(useWorkspaceStore.getState().activeFileId).toBe('a');
    });

    it('closing the last tab clears active', () => {
      useWorkspaceStore.getState().openFile(file({ _id: 'a' }));
      useWorkspaceStore.getState().closeTab('a');
      expect(useWorkspaceStore.getState().activeFileId).toBeNull();
    });
  });

  describe('files', () => {
    it('updates file content by id', () => {
      useWorkspaceStore.getState().setFiles([file({}), file({ _id: 'f2', name: 'b.js' })]);
      useWorkspaceStore.getState().updateFileContent('f2', 'hello');
      expect(useWorkspaceStore.getState().files.find((f) => f._id === 'f2')?.content).toBe('hello');
    });

    it('upsertFile inserts new and replaces existing', () => {
      useWorkspaceStore.getState().setFiles([file({})]);
      useWorkspaceStore.getState().upsertFile(file({ _id: 'f2', name: 'new.js' }));
      expect(useWorkspaceStore.getState().files).toHaveLength(2);

      useWorkspaceStore.getState().upsertFile(file({ name: 'renamed.js' }));
      expect(useWorkspaceStore.getState().files.find((f) => f._id === 'f1')?.name).toBe('renamed.js');
      expect(useWorkspaceStore.getState().files).toHaveLength(2);
    });

    it('removeFile drops the file and any children, and closes its tab', () => {
      useWorkspaceStore.getState().setFiles([
        file({ _id: 'dir', isDirectory: true }),
        file({ _id: 'child', parentId: 'dir' }),
        file({ _id: 'other' }),
      ]);
      useWorkspaceStore.getState().openFile(file({ _id: 'child' }));
      useWorkspaceStore.getState().removeFile('dir');
      const ids = useWorkspaceStore.getState().files.map((f) => f._id);
      expect(ids).toEqual(['other']);
      expect(useWorkspaceStore.getState().openTabs).toEqual([]);
    });
  });

  describe('presence', () => {
    it('stores online user ids', () => {
      useWorkspaceStore.getState().setOnline(['u1', 'u2']);
      expect(useWorkspaceStore.getState().online).toEqual(['u1', 'u2']);
    });
  });
});

describe('isReadOnly', () => {
  it('is true only for viewers', () => {
    expect(isReadOnly('viewer')).toBe(true);
    expect(isReadOnly('editor')).toBe(false);
    expect(isReadOnly('owner')).toBe(false);
    expect(isReadOnly(null)).toBe(false);
  });
});
