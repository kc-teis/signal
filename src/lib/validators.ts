import { z } from "zod";

export const submitLinkSchema = z.object({
  url: z.string().url("Please enter a valid URL").optional(),
  contributorName: z.string().min(1, "Name is required"),
  contributorEmail: z.string().email("Please enter a valid email"),
  contextNote: z.string().optional(),
  prompts: z
    .array(z.object({ title: z.string().min(1), body: z.string().min(1) }))
    .optional(),
});

export const submitPromptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Prompt body is required"),
  categorySlugs: z.array(z.string()).min(1, "At least one category required"),
  contributorName: z.string().min(1, "Name is required"),
  contributorEmail: z.string().email("Please enter a valid email"),
  contextNote: z.string().optional(),
});

export const publishLinkSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  categorySlugs: z.array(z.string()).min(1, "At least one category required"),
  contentTypes: z
    .array(z.enum(["ARTICLE", "VIDEO", "PODCAST", "PROMPT"]))
    .min(1, "At least one content type required"),
  thumbnailUrl: z.string().url().optional().nullable(),
  contextNote: z.string().optional().nullable(),
  regenerateEnrichment: z.boolean().optional(),
});

export const feedQuerySchema = z.object({
  categories: z.string().optional(), // comma-separated slugs
  contributor: z.string().optional(),
  contentTypes: z.string().optional(), // comma-separated: ARTICLE,VIDEO
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type SubmitLinkInput = z.infer<typeof submitLinkSchema>;
export type PublishLinkInput = z.infer<typeof publishLinkSchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
