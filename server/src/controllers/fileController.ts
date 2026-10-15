import { Response } from "express";
import { File } from "../models/File";
import { asyncHandler } from "../middlewares/asyncHandler";
import { AppError } from "../utils/appError";
import { AuthRequest } from "../middlewares/auth";
import { createFileSchema } from "../validations/file";
import mongoose from "mongoose";

export const getFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const files = await File.find({ workspaceId }).sort({ isDirectory: -1, name: 1 });
  res.json({ success: true, files });
});

export const createFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const data = createFileSchema.parse(req.body);
  let parentPath = "/";
  if (data.parentId) {
    const parent = await File.findById(data.parentId);
    if (!parent || !parent.isDirectory) throw new AppError("Invalid parent", 400);
    parentPath = parent.path.endsWith("/") ? parent.path : parent.path + "/";
  }
  const path = data.isDirectory ? `${parentPath}${data.name}/` : `${parentPath}${data.name}`;
  const file = await File.create({
    workspaceId: String(workspaceId),
    name: data.name,
    path,
    language: data.language || "plaintext",
    content: data.content || "",
    parentId: data.parentId || null,
    isDirectory: !!data.isDirectory,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, file });
});

export const updateFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileId } = req.params;
  const file = await File.findById(fileId);
  if (!file) throw new AppError("File not found", 404);
  if (req.body.content !== undefined) file.content = req.body.content;
  if (req.body.name !== undefined) {
    file.name = req.body.name;
    file.path = file.path.replace(/[^/]*$/, file.name + (file.isDirectory ? "/" : ""));
  }
  await file.save();
  res.json({ success: true, file });
});

export const deleteFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileId } = req.params;
  const file = await File.findById(fileId);
  if (!file) throw new AppError("File not found", 404);
  const escaped = file.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await File.deleteMany({ path: { $regex: "^" + escaped } });
  await File.findByIdAndDelete(fileId);
  res.json({ success: true });
});
