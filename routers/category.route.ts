import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  getCategorySchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "../validations/category.validation";

import { paginationQuerySchema } from "../validations/common.validation";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(paginationQuerySchema), getCategories);
router.get("/:id", validate(getCategorySchema), getCategory);
router.post("/", validate(createCategorySchema), createCategory);
router.put("/:id", validate(updateCategorySchema), updateCategory);
router.delete("/:id", validate(deleteCategorySchema), deleteCategory);

export default router;
