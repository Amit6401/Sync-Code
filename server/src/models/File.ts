import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  path: string;
  language: string;
  content: string;
  parentId?: mongoose.Types.ObjectId | null;
  isDirectory: boolean;
  createdBy: mongoose.Types.ObjectId;
}

const fileSchema = new Schema<IFile>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true },
    language: { type: String, default: 'plaintext' },
    content: { type: String, default: '' },
    parentId: { type: Schema.Types.ObjectId, ref: 'File', default: null },
    isDirectory: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const File = mongoose.model<IFile>('File', fileSchema);
