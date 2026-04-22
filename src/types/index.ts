export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Prompt {
  id: string;
  linkId: string | null;
  title: string;
  body: string;
  contributorName: string;
  contributorEmail: string;
  categorySlugs: string[];
  sortOrder: number;
  createdAt: string;
}

export interface Link {
  id: string;
  url: string | null;
  slug: string;
  title: string | null;
  summary: string | null;
  thumbnailUrl: string | null;
  categorySlugs: string[];
  contentTypes: string[];
  contributorName: string;
  contributorEmail: string;
  contextNote: string | null;
  metadata: Record<string, unknown> | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
}

export type LinkWithCategory = Link & {
  categories: Category[];
  promptCount?: number;
  promptBody?: string | null;
  prompts?: Prompt[];
};

export interface ContributorSummary {
  name: string;
  email: string;
  linkCount: number;
  latestSubmission: string;
}

export interface FeedResponse {
  links: LinkWithCategory[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FolderPrompt {
  id: string;
  folderId: string;
  title: string;
  body: string;
  sortOrder: number;
  createdAt: string;
}

export interface PromptFolder {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categorySlugs: string[];
  contributorName: string;
  contributorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptFolderWithDetails = PromptFolder & {
  categories: Category[];
  prompts: FolderPrompt[];
};

export interface EnrichmentPreview {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlugs: string[];
  contentTypes: string[];
  thumbnailUrl: string | null;
  contextNote: string | null;
  url: string | null;
}
