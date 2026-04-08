export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Link {
  id: string;
  url: string;
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

export interface EnrichmentPreview {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlugs: string[];
  contentTypes: string[];
  thumbnailUrl: string | null;
  contextNote: string | null;
  url: string;
}
