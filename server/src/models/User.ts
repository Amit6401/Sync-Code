import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (candidate: string, hashed: string) => bcrypt.compare(candidate, hashed);
