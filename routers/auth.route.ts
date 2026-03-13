import { Router } from "express";
import { register, login, refresh, revoke } from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  revokeSchema,
} from "../validations/auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/revoke", authMiddleware, validate(revokeSchema), revoke);

export default router;
