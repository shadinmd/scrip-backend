import { Router } from "express";
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/account.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  getAccountSchema,
  createAccountSchema,
  updateAccountSchema,
  deleteAccountSchema,
} from "../validations/account.validation";
import { paginationQuerySchema } from "../validations/common.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(paginationQuerySchema), getAccounts);
router.get("/:id", validate(getAccountSchema), getAccount);
router.post("/", validate(createAccountSchema), createAccount);
router.put("/:id", validate(updateAccountSchema), updateAccount);
router.delete("/:id", validate(deleteAccountSchema), deleteAccount);

export default router;
