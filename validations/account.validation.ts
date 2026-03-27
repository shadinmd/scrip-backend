import { z } from "zod";

export const getAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    balance: z.number().optional().default(0),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    balance: z.number().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
