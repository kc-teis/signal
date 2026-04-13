import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { FeedResponse, LinkWithCategory } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export interface LinkFilters {
  categories?: string[];
  contributor?: string;
  contentTypes?: string[];
  sort?: string;
}

async function fetchLinksPage(
  filters: LinkFilters,
  page: number
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (filters.categories && filters.categories.length > 0)
    params.set("categories", filters.categories.join(","));
  if (filters.contributor) params.set("contributor", filters.contributor);
  if (filters.contentTypes && filters.contentTypes.length > 0)
    params.set("contentTypes", filters.contentTypes.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("limit", String(DEFAULT_PAGE_SIZE));

  const res = await fetch(`/api/links?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch links");
  return res.json();
}

async function fetchLinkBySlug(slug: string): Promise<LinkWithCategory> {
  const res = await fetch(`/api/links/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch link");
  return res.json();
}

export function useLinks(filters: LinkFilters) {
  return useInfiniteQuery({
    queryKey: ["links", filters],
    queryFn: ({ pageParam = 1 }) => fetchLinksPage(filters, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useLinkBySlug(slug: string) {
  return useQuery({
    queryKey: ["link", slug],
    queryFn: () => fetchLinkBySlug(slug),
    enabled: !!slug,
  });
}
