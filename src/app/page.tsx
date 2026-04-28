"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLinks, type LinkFilters } from "@/hooks/use-links";
import { FilterBar } from "@/components/feed/filter-bar";
import { SearchBar } from "@/components/feed/search-bar";
import { FeedGrid, type ViewMode } from "@/components/feed/feed-grid";
import { CATEGORIES } from "@/lib/constants";
import type { ContributorSummary } from "@/types";

export default function FeedPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expanded, setExpanded] = useState(false);
  const expandedInitialized = useRef(false);
  const [filters, setFilters] = useState<LinkFilters>({
    categories: [],
    contributor: "",
    contentTypes: [],
    search: "",
    sort: "newest",
  });
  const [lastVisit, setLastVisit] = useState<Date | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("kh_last_visit");
    setLastVisit(saved ? new Date(saved) : null);
    window.localStorage.setItem("kh_last_visit", new Date().toISOString());
    const savedExpanded = window.localStorage.getItem("kh_cards_expanded");
    if (savedExpanded !== null) setExpanded(savedExpanded === "true");
    expandedInitialized.current = true;
  }, []);

  useEffect(() => {
    if (!expandedInitialized.current) return;
    window.localStorage.setItem("kh_cards_expanded", String(expanded));
  }, [expanded]);

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useLinks(filters);

  const { data: contributors = [] } = useQuery<ContributorSummary[]>({
    queryKey: ["contributors"],
    queryFn: async () => {
      const res = await fetch("/api/contributors");
      if (!res.ok) throw new Error("Failed to fetch contributors");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  function updateFilter<K extends keyof LinkFilters>(
    key: K,
    value: LinkFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({
      categories: [],
      contributor: "",
      contentTypes: [],
      search: "",
      sort: "newest",
    });
  }

  const allLinks = data?.pages.flatMap((page) => page.links) ?? [];
  const totalCount = data?.pages[0]?.total ?? undefined;

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <div className="space-y-6">
      <SearchBar
        value={filters.search ?? ""}
        onChange={(v) => updateFilter("search", v)}
        resultCount={filters.search ? totalCount : undefined}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <FilterBar
          categories={[...CATEGORIES]}
          contributors={contributors.map((c) => ({
            name: c.name,
            email: c.email,
          }))}
          selectedCategories={filters.categories ?? []}
          selectedContentTypes={filters.contentTypes ?? []}
          contributor={filters.contributor ?? ""}
          sort={filters.sort ?? "newest"}
          expanded={expanded}
          onCategoriesChange={(v) => updateFilter("categories", v)}
          onContentTypesChange={(v) => updateFilter("contentTypes", v)}
          onContributorChange={(v) => updateFilter("contributor", v)}
          onSortChange={(v) => updateFilter("sort", v)}
          onExpandedChange={setExpanded}
          onClear={clearFilters}
        />

        <div className="flex shrink-0 gap-1 self-start rounded-md border p-0.5" role="tablist" aria-label="View mode">
          <button
            role="tab"
            aria-selected={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              viewMode === "grid"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cards
          </button>
          <button
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              viewMode === "list"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <FeedGrid
        links={allLinks}
        isLoading={isLoading}
        viewMode={viewMode}
        expanded={expanded}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        lastVisit={lastVisit}
      />
    </div>
  );
}
