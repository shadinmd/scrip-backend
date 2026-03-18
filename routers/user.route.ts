import { Router } from "express";
import {
  getMe,
  updateFcmToken,
  testNotification,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.post("/push-token", authMiddleware, updateFcmToken);
router.post("/test-notification", authMiddleware, testNotification);

export default router;
