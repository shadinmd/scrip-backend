import { z } from "zod";

export const installmentSchema = z.object({
  amount: z.number().positive("Installment amount must be positive"),
  date: z.string().date("Invalid installment date format"),
  isPaid: z.boolean().optional().default(false),
});

export const createLoanSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Loan name is required"),
      installments: z
        .array(installmentSchema)
        .min(1, "At least one installment is required"),
    })
    .superRefine((data, ctx) => {
      const months = data.installments.map((inst) => inst.date.substring(0, 7));
      const hasDuplicateMonths = months.some(
        (month, index) => months.indexOf(month) !== index,
      );

      if (hasDuplicateMonths) {
        ctx.addIssue({
          code: "custom",
          message: "Each installment must be in a different month",
          path: ["installments"],
        });
      }
    }),
});

export const updateLoanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z
    .object({
      name: z.string().min(1, "Loan name is required").optional(),
      installments: z
        .array(installmentSchema)
        .min(1, "At least one installment is required")
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.installments) {
        // Extract YYYY-MM from each date
        const months = data.installments.map((inst) =>
          inst.date.substring(0, 7),
        );
        const hasDuplicateMonths = months.some(
          (month, index) => months.indexOf(month) !== index,
        );

        if (hasDuplicateMonths) {
          ctx.addIssue({
            code: "custom",
            message: "Each installment must be in a different month",
            path: ["installments"],
          });
        }
      }
    }),
});

export const getLoanSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const toggleInstallmentPaidSchema = z.object({
  params: z.object({
    installmentId: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z
    .object({
      create_transaction: z.boolean().optional().default(false),
      accountId: z.number().int().positive().optional(),
    })
    .refine(
      (data) => {
        if (data.create_transaction && !data.accountId) {
          return false;
        }
        return true;
      },
      {
        message: "Account ID is required if create_transaction is true",
        path: ["accountId"],
      },
    ),
});
