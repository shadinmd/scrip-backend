import { z } from "zod";

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page must be a number").optional().default("1"),
    limit: z.string().regex(/^\d+$/, "Limit must be a number").optional().default("10"),
  }),
});
