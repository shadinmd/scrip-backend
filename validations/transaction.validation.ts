import { z } from "zod";

export const getTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a number")
      .optional()
      .default("1"),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a number")
      .optional()
      .default("10"),
    min_amount: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "min_amount must be a number")
      .optional(),
    max_amount: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "max_amount must be a number")
      .optional(),
    start_date: z
      .string()
      .date("Invalid start date format (YYYY-MM-DD)")
      .optional(),
    end_date: z
      .string()
      .date("Invalid end date format (YYYY-MM-DD)")
      .optional(),
    categoryId: z
      .string()
      .regex(/^\d+$/, "categoryId must be a number")
      .optional(),
    categoryIds: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be a positive number"),
    description: z.string().min(1, "Description is required"),
    date: z.string().date("Invalid date format (YYYY-MM-DD)"),
    categoryId: z
      .number()
      .int()
      .positive("Valid Category ID is required")
      .optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    description: z.string().min(1, "Description is required").optional(),
    date: z.string().date("Invalid date format (YYYY-MM-DD)").optional(),
    categoryId: z
      .number()
      .int()
      .positive("Valid Category ID is required")
      .nullable()
      .optional(),
  }),
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
