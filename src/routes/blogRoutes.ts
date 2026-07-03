import { Router } from "express";
import { getPublicBlogs, getPublicBlogById } from "../controllers/blogController";

const router = Router();

router.get("/", getPublicBlogs);
router.get("/:id", getPublicBlogById);

export default router;
