import { z } from "zod";

export const getCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .optional(),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number"),
  }),
});
