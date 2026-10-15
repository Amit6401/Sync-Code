import { Response } from "express";
import { Workspace } from "../models/Workspace";
import { User } from "../models/User";
import { File } from "../models/File";
import { asyncHandler } from "../middlewares/asyncHandler";
import { AppError } from "../utils/appError";
import { AuthRequest } from "../middlewares/auth";
import { createWorkspaceSchema, addMemberSchema, updateMemberRoleSchema, updateWorkspaceSchema } from "../validations/workspace";
import { getTemplate, listTemplates } from "../utils/templates";

export const getTemplates = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, templates: listTemplates() });
});

export const createWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createWorkspaceSchema.parse(req.body);
  const workspace = await Workspace.create({
    name: data.name,
    description: data.description,
    owner: req.user._id,
    members: [{ user: req.user._id, role: "owner" }],
  });
  const template = getTemplate(data.template);
  await File.insertMany(
    template.files.map((f) => ({
      workspaceId: workspace._id,
      name: f.name,
      path: "/" + f.name,
      language: f.language,
      content: f.content,
      parentId: null,
      isDirectory: false,
      createdBy: req.user._id,
    }))
  );
  res.status(201).json({ success: true, workspace });
});

export const getWorkspaces = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaces = await Workspace.find({
    $or: [
      { owner: req.user._id },
      { "members.user": req.user._id },
    ],
  })
    .populate("owner", "name email")
    .populate("members.user", "name email")
    .sort({ updatedAt: -1 });
  res.json({ success: true, workspaces });
});

export const getWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.workspaceId)
    .populate("owner", "name email")
    .populate("members.user", "name email");
  if (!workspace) throw new AppError("Workspace not found", 404);
  res.json({ success: true, workspace });
});

export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const data = addMemberSchema.parse(req.body);
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Only owner can add members", 403);
  const user = await User.findOne({ email: data.email });
  if (!user) throw new AppError("User not found", 404);
  const exists = workspace.members.find((m: any) => m.user.toString() === user._id.toString());
  if (exists) throw new AppError("Already a member", 409);
  workspace.members.push({ user: user._id, role: data.role });
  await workspace.save();
  await workspace.populate("owner", "name email");
  await workspace.populate("members.user", "name email");
  res.json({ success: true, workspace });
});

export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId, userId } = req.params;
  const data = updateMemberRoleSchema.parse(req.body);
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Only owner can change roles", 403);
  if (workspace.owner.toString() === userId) throw new AppError("Cannot change owner role", 400);
  const member = workspace.members.find((m: any) => m.user.toString() === userId);
  if (!member) throw new AppError("Member not found", 404);
  member.role = data.role;
  await workspace.save();
  await workspace.populate("owner", "name email");
  await workspace.populate("members.user", "name email");
  res.json({ success: true, workspace });
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId, userId } = req.params;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Only owner can remove members", 403);
  if (workspace.owner.toString() === userId) throw new AppError("Cannot remove owner", 400);
  const before = workspace.members.length;
  workspace.members = workspace.members.filter((m: any) => m.user.toString() !== userId);
  if (workspace.members.length === before) throw new AppError("Member not found", 404);
  await workspace.save();
  await workspace.populate("owner", "name email");
  await workspace.populate("members.user", "name email");
  res.json({ success: true, workspace });
});

export const updateWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const data = updateWorkspaceSchema.parse(req.body);
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Only owner can update workspace", 403);
  if (data.name !== undefined) workspace.name = data.name;
  if (data.description !== undefined) workspace.description = data.description;
  await workspace.save();
  await workspace.populate("owner", "name email");
  await workspace.populate("members.user", "name email");
  res.json({ success: true, workspace });
});

export const deleteWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError("Workspace not found", 404);
  if (workspace.owner.toString() !== req.user._id.toString()) throw new AppError("Only owner can delete workspace", 403);
  await File.deleteMany({ workspaceId: workspace._id });
  await Workspace.findByIdAndDelete(workspaceId);
  res.json({ success: true });
});
