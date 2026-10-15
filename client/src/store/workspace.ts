import { create } from 'zustand';
import type { Workspace, WorkspaceFile, Role } from '../types';
import { refId } from '../types';

interface WorkspaceState {
  workspace: Workspace | null;
  files: WorkspaceFile[];
  openTabs: string[];
  activeFileId: string | null;
  myRole: Role | null;
  online: string[];

  setWorkspace: (workspace: Workspace, meId: string) => void;
  setFiles: (files: WorkspaceFile[]) => void;
  openFile: (file: WorkspaceFile) => void;
  closeTab: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  upsertFile: (file: WorkspaceFile) => void;
  removeFile: (fileId: string) => void;
  setOnline: (online: string[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  files: [],
  openTabs: [],
  activeFileId: null,
  myRole: null,
  online: [],

  setWorkspace: (workspace, meId) => {
    const owner = refId(workspace.owner);
    const member = workspace.members.find((m) => refId(m.user) === meId);
    const role: Role = owner === meId ? 'owner' : member ? member.role : 'viewer';
    set({ workspace, myRole: role });
  },

  setFiles: (files) => set({ files }),

  openFile: (file) => {
    const state = get();
    if (state.openTabs.includes(file._id)) {
      set({ activeFileId: file._id });
      return;
    }
    set({ openTabs: [...state.openTabs, file._id], activeFileId: file._id });
  },

  closeTab: (fileId) => {
    const state = get();
    const openTabs = state.openTabs.filter((id) => id !== fileId);
    const activeFileId =
      state.activeFileId === fileId ? (openTabs.length ? openTabs[openTabs.length - 1] : null) : state.activeFileId;
    set({ openTabs, activeFileId });
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) =>
    set((s) => ({ files: s.files.map((f) => (f._id === fileId ? { ...f, content } : f)) })),

  upsertFile: (file) =>
    set((s) => {
      const exists = s.files.some((f) => f._id === file._id);
      return { files: exists ? s.files.map((f) => (f._id === file._id ? file : f)) : [...s.files, file] };
    }),

  removeFile: (fileId) =>
    set((s) => {
      const removed = new Set([fileId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of s.files) {
          if (f.parentId && removed.has(f.parentId) && !removed.has(f._id)) {
            removed.add(f._id);
            changed = true;
          }
        }
      }
      const openTabs = s.openTabs.filter((id) => !removed.has(id));
      return {
        files: s.files.filter((f) => !removed.has(f._id)),
        openTabs,
        activeFileId: s.activeFileId && removed.has(s.activeFileId) ? null : s.activeFileId,
      };
    }),

  setOnline: (online) => set({ online }),
}));

export const isReadOnly = (role: Role | null) => role === 'viewer';
