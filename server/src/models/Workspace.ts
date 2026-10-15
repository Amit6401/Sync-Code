import mongoose, { Document, Schema } from 'mongoose';

export type MemberRole = 'owner' | 'editor' | 'viewer';

export interface IMember {
  user: mongoose.Types.ObjectId;
  role: MemberRole;
}

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IMember[];
}

const memberSchema = new Schema<IMember>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor', required: true },
});

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

export const Workspace = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
