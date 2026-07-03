import { Router } from "express";
import {
  getAdminBlogs,
  getAdminBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../controllers/blogController";
import { protect, adminOnly } from "../../middleware/auth";
import upload from "../../middleware/upload";
import { uploadImage } from "../../controllers/uploadController";

const router = Router();

router.use(protect, adminOnly);

router.get("/", getAdminBlogs);
router.post("/", createBlog);
router.get("/:id", getAdminBlogById);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);
router.post("/upload", upload.single("image"), uploadImage);
export default router;
