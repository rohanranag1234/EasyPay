import { Router } from "express";
import { createRecipient, deleteRecipient, listRecipients } from "../controllers/recipient.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errors";
const router = Router(); router.use(requireAuth);
router.get("/", asyncHandler(listRecipients)); router.post("/", asyncHandler(createRecipient)); router.delete("/:id", asyncHandler(deleteRecipient));
export default router;
