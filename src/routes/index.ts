import { Router } from "express";
import authRoutes from "./authRoutes";
import blogRoutes from "./blogRoutes";
import commentRoutes from "./commentRoutes";
import adminBlogRoutes from "./admin/adminBlogRoutes";
import adminCommentRoutes from "./admin/adminCommentRoutes";

const router = Router();

// Public
router.use("/auth", authRoutes);
router.use("/blogs", blogRoutes);
router.use("/comments", commentRoutes);

// Admin only (protected inside each file via protect + adminOnly)
router.use("/admin/blogs", adminBlogRoutes);
router.use("/admin/comments", adminCommentRoutes);

export default router;
