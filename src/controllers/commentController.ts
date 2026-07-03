import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Comment from "../models/Comment";
import Blog from "../models/Blog";

const SITE_TYPES = ["medical", "general", "love"];

// GET /api/comments?blogId=xxx   (public — approved only)
export const getApprovedComments = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.query;
  if (!blogId) {
    res.status(400).json({ error: "blogId is required" });
    return;
  }

  const comments = await Comment.find({ blog: blogId, status: "approved" })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json({ comments });
});

// POST /api/comments   (logged-in user — always created as pending)
export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { blogId, content } = req.body;
  if (!blogId || !content) {
    res.status(400).json({ error: "blogId and content are required" });
    return;
  }

  const comment = await Comment.create({
    blog: blogId,
    user: req.user!.id,
    content,
    status: "pending",
  });

  res.status(201).json({
    message: "Comment submitted. It will be visible after admin approval.",
    comment,
  });
});

// DELETE /api/comments/:id   (admin or comment owner)
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  const isOwner = comment.user.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await comment.deleteOne();
  res.json({ message: "Comment deleted" });
});

// ── Admin ──────────────────────────────────────────────────────

// GET /api/admin/comments?status=pending&siteType=   (admin — default: pending)
export const getCommentsForModeration = asyncHandler(async (req: Request, res: Response) => {
  const status = (req.query.status as string) || "pending";
  const siteType = req.query.siteType as string | undefined;

  const filter: Record<string, unknown> = { status };
  if (siteType && SITE_TYPES.includes(siteType)) {
    const blogIds = await Blog.find({ siteType }).select("_id").lean();
    filter.blog = { $in: blogIds.map((b) => b._id) };
  }

  const comments = await Comment.find(filter)
    .populate("user", "name email")
    .populate("blog", "title slug siteType")
    .sort({ createdAt: -1 });

  res.json({ comments });
});

// PATCH /api/admin/comments/:id   body: { status: "approved" | "rejected" }   (admin)
export const moderateComment = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    return;
  }

  const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  res.json({ message: `Comment ${status}`, comment });
});
