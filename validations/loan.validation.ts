import { z } from "zod";

export const installmentSchema = z.object({
  amount: z.number().positive("Installment amount must be positive"),
  date: z.string().date("Invalid installment date format"),
  isPaid: z.boolean().optional().default(false),
});

export const createLoanSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Loan name is required"),
    installments: z.array(installmentSchema).min(1, "At least one installment is required"),
  }),
});

export const updateLoanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    name: z.string().min(1, "Loan name is required").optional(),
  }),
});

export const getLoanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
