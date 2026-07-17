"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterModal } from "@/components/feed/filter-modal";

interface FilterBarProps {
  categories: { name: string; slug: string }[];
  contributors: { name: string; email: string }[];
  selectedCategories: string[];
  selectedContentTypes: string[];
  selectedContributors: string[];
  sort: string;
  onCategoriesChange: (slugs: string[]) => void;
  onContentTypesChange: (types: string[]) => void;
  onContributorsChange: (emails: string[]) => void;
  onSortChange: (value: string) => void;
  onClear: () => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Article",
  VIDEO: "Video",
  PODCAST: "Podcast",
  PROMPT: "Prompt",
};

export function FilterBar({
  categories,
  contributors,
  selectedCategories,
  selectedContentTypes,
  selectedContributors,
  sort,
  onCategoriesChange,
  onContentTypesChange,
  onContributorsChange,
  onSortChange,
  onClear,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.name]));
  const contributorByEmail = new Map(contributors.map((c) => [c.email, c.name]));

  const activeFilterCount =
    selectedCategories.length +
    selectedContentTypes.length +
    selectedContributors.length +
    (sort !== "newest" ? 1 : 0);

  const hasFilters = activeFilterCount > 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleOpen}
          className="gap-2"
        >
          <SlidersHorizontal className="size-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge className="ml-0.5 flex size-5 items-center justify-center rounded-full p-0 text-[11px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedCategories.map((slug) => (
            <Badge key={slug} variant="secondary" className="gap-1 rounded-full pr-1.5">
              {categoryBySlug.get(slug) ?? slug}
              <button
                onClick={() => onCategoriesChange(selectedCategories.filter((s) => s !== slug))}
                aria-label={`Remove ${categoryBySlug.get(slug) ?? slug} filter`}
                className="rounded-full p-0.5 hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedContentTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1 rounded-full pr-1.5">
              {CONTENT_TYPE_LABELS[type] ?? type}
              <button
                onClick={() => onContentTypesChange(selectedContentTypes.filter((t) => t !== type))}
                aria-label={`Remove ${CONTENT_TYPE_LABELS[type] ?? type} filter`}
                className="rounded-full p-0.5 hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedContributors.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 rounded-full pr-1.5">
              {contributorByEmail.get(email) ?? email}
              <button
                onClick={() => onContributorsChange(selectedContributors.filter((e) => e !== email))}
                aria-label={`Remove ${contributorByEmail.get(email) ?? email} filter`}
                className="rounded-full p-0.5 hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {sort !== "newest" && (
            <Badge variant="secondary" className="gap-1 rounded-full pr-1.5">
              {sort === "oldest" ? "Oldest first" : sort === "mostUpvoted" ? "Most upvoted" : sort}
              <button
                onClick={() => onSortChange("newest")}
                aria-label="Reset sort order"
                className="rounded-full p-0.5 hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {isOpen && (
        <FilterModal
          categories={categories}
          contributors={contributors}
          selectedCategories={selectedCategories}
          selectedContentTypes={selectedContentTypes}
          selectedContributors={selectedContributors}
          sort={sort}
          onCategoriesChange={onCategoriesChange}
          onContentTypesChange={onContentTypesChange}
          onContributorsChange={onContributorsChange}
          onSortChange={onSortChange}
          onClear={onClear}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
