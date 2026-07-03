import { Router } from "express";
import { getApprovedComments, createComment, deleteComment } from "../controllers/commentController";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", getApprovedComments);
router.post("/", protect, createComment);
router.delete("/:id", protect, deleteComment);

export default router;
