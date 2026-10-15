export type Role = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface PopulatedUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
}

export type UserRef = string | PopulatedUser;

export interface Member {
  user: UserRef;
  role: Role;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: UserRef;
  members: Member[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceFile {
  _id: string;
  workspaceId: string;
  name: string;
  path: string;
  language: string;
  content: string;
  parentId: string | null;
  isDirectory: boolean;
  createdBy: string;
}

export type WsServerEvent =
  | { type: 'connected'; message: string }
  | { type: 'presence:update'; payload: { online: string[] } }
  | { type: 'file:update'; payload: { fileId: string; content: string; userId: string } }
  | { type: 'file:created'; payload: { file: WorkspaceFile } }
  | { type: 'file:renamed'; payload: { file: WorkspaceFile } }
  | { type: 'file:deleted'; payload: { fileId: string } }
  | { type: 'cursor:update'; payload: { fileId: string; userId: string; line: number; column: number; name?: string } }
  | { type: 'error'; message: string };

export const refId = (ref: UserRef | undefined | null): string => {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return ref.id || ref._id || '';
};

export const refName = (ref: UserRef | undefined | null): string => {
  if (!ref) return 'Unknown';
  if (typeof ref === 'string') return ref.slice(-6);
  return ref.name || ref.email || (ref._id || ref.id || '').slice(-6);
};
