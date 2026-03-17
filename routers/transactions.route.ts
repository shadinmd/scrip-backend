import { Router } from "express";
import {
  getTransactions,
  getSummary,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  getTransactionSchema,
  getTransactionsQuerySchema,
  createTransactionSchema,
  updateTransactionSchema,
  deleteTransactionSchema,
} from "../validations/transaction.validation";

import { paginationQuerySchema } from "../validations/common.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(getTransactionsQuerySchema), getTransactions);
router.get("/summary", getSummary);
router.get("/:id", validate(getTransactionSchema), getTransaction);
router.post("/", validate(createTransactionSchema), createTransaction);
router.put("/:id", validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", validate(deleteTransactionSchema), deleteTransaction);

export default router;
