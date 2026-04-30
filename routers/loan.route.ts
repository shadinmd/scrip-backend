import { Router } from "express";
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanProjections,
  getInstallments,
  toggleInstallmentPaid,
} from "../controllers/loan.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createLoanSchema,
  updateLoanSchema,
  getLoanSchema,
  toggleInstallmentPaidSchema,
} from "../validations/loan.validation";
import { paginationQuerySchema } from "../validations/common.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(paginationQuerySchema), getLoans);
router.get("/projections", getLoanProjections);
router.get("/installments", getInstallments);
router.get("/:id", validate(getLoanSchema), getLoan);
router.post("/", validate(createLoanSchema), createLoan);
router.put("/:id", validate(updateLoanSchema), updateLoan);
router.delete("/:id", validate(getLoanSchema), deleteLoan);
router.patch(
  "/installments/:installmentId/toggle-paid",
  validate(toggleInstallmentPaidSchema),
  toggleInstallmentPaid,
);

export default router;
