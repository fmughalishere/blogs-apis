import { Router } from "express";
import { getCommentsForModeration, moderateComment } from "../../controllers/commentController";
import { protect, adminOnly } from "../../middleware/auth";

const router = Router();

router.use(protect, adminOnly);

router.get("/", getCommentsForModeration);
router.patch("/:id", moderateComment);

export default router;
