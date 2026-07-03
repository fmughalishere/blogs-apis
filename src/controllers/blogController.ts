import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Blog from "../models/Blog";

const SITE_TYPES = ["medical", "general", "love"];

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export const getPublicBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(parseInt((req.query.limit as string) || "9"), 50);
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const siteType = req.query.siteType as string | undefined;

  const filter: Record<string, unknown> = { status: "published" };
  if (siteType && SITE_TYPES.includes(siteType)) filter.siteType = siteType;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };
  const [total, blogs] = await Promise.all([
    Blog.countDocuments(filter),
    Blog.find(filter)
      .select("title slug excerpt coverImage category siteType tags status views createdAt author")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  res.json({ blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getPublicBlogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const siteType = req.query.siteType as string | undefined;

  const baseQuery: Record<string, unknown> = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id, status: "published" }
    : { slug: id, status: "published" };
  if (siteType && SITE_TYPES.includes(siteType)) baseQuery.siteType = siteType;

  const blog = await Blog.findOneAndUpdate(baseQuery, { $inc: { views: 1 } }, { new: true })
    .populate("author", "name")
    .lean();

  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ blog });
});

export const getAdminBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 100);
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const siteType = req.query.siteType as string | undefined;

  const filter: Record<string, unknown> = {};
  if (siteType && SITE_TYPES.includes(siteType)) filter.siteType = siteType;
  if (status && status !== "all") filter.status = status;
  if (search) filter.title = { $regex: search, $options: "i" };

  const [total, blogs] = await Promise.all([
    Blog.countDocuments(filter),
    Blog.find(filter)
      .select("title slug category siteType status views createdAt author")
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  res.json({ blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getAdminBlogById = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findById(req.params.id).populate("author", "name").lean();
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ blog });
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const { title, excerpt, content, coverImage, category, tags, status, siteType } = req.body;

  if (!title || !excerpt || !content) {
    res.status(400).json({ error: "Title, excerpt and content are required" });
    return;
  }
  if (!siteType || !SITE_TYPES.includes(siteType)) {
    res.status(400).json({ error: "A valid siteType (medical, general, or love) is required" });
    return;
  }

  let slug = slugify(title);
  const existing = await Blog.findOne({ slug }).select("_id").lean();
  if (existing) slug = `${slug}-${Date.now()}`;

  const blog = await Blog.create({
    title,
    slug,
    excerpt,
    content,
    coverImage,
    category,
    siteType,
    tags,
    status: status || "published",
    author: req.user!.id,
  });

  res.status(201).json({ message: "Blog created", blog });
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const { siteType } = req.body;
  if (siteType && !SITE_TYPES.includes(siteType)) {
    res.status(400).json({ error: "Invalid siteType" });
    return;
  }

  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ message: "Blog updated", blog });
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    res.status(404).json({ error: "Blog not found" });
    return;
  }
  res.json({ message: "Blog deleted" });
});
