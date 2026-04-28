"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { ArticleIcon, VideoIcon, PodcastIcon, PromptIcon } from "@/components/icons/content-type-icons";

interface FilterBarProps {
  categories: { name: string; slug: string }[];
  contributors: { name: string; email: string }[];
  selectedCategories: string[];
  selectedContentTypes: string[];
  contributor: string;
  sort: string;
  expanded?: boolean;
  onCategoriesChange: (slugs: string[]) => void;
  onContentTypesChange: (types: string[]) => void;
  onContributorChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onClear: () => void;
}

const CONTENT_TYPES = [
  { label: "Article", value: "ARTICLE" },
  { label: "Video", value: "VIDEO" },
  { label: "Podcast", value: "PODCAST" },
  { label: "Prompt", value: "PROMPT" },
] as const;

export function FilterBar({
  categories,
  contributors,
  selectedCategories,
  selectedContentTypes,
  contributor,
  sort,
  expanded = false,
  onCategoriesChange,
  onContentTypesChange,
  onContributorChange,
  onSortChange,
  onExpandedChange,
  onClear,
}: FilterBarProps) {
  const hasFilters =
    selectedCategories.length > 0 ||
    selectedContentTypes.length > 0 ||
    contributor ||
    sort !== "newest";

  function toggleCategory(slug: string) {
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter((s) => s !== slug));
    } else {
      onCategoriesChange([...selectedCategories, slug]);
    }
  }

  function toggleContentType(type: string) {
    if (selectedContentTypes.includes(type)) {
      onContentTypesChange(selectedContentTypes.filter((t) => t !== type));
    } else {
      onContentTypesChange([...selectedContentTypes, type]);
    }
  }

  const categoriesFiltered = selectedCategories.length > 0;
  const typesFiltered = selectedContentTypes.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Categories
        </span>
        <Badge
          variant={categoriesFiltered ? "outline" : "default"}
          className="cursor-pointer select-none"
          onClick={() => onCategoriesChange([])}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.slug}
            variant={
              selectedCategories.includes(cat.slug) ? "default" : "outline"
            }
            className="cursor-pointer select-none"
            onClick={() => toggleCategory(cat.slug)}
          >
            {cat.name}
          </Badge>
        ))}
        {categoriesFiltered && (
          <button
            onClick={() => onCategoriesChange([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Type
        </span>
        <Badge
          variant={typesFiltered ? "outline" : "default"}
          className="cursor-pointer select-none"
          onClick={() => onContentTypesChange([])}
        >
          All
        </Badge>
        {CONTENT_TYPES.map((ct) => (
          <Badge
            key={ct.value}
            variant={
              selectedContentTypes.includes(ct.value) ? "default" : "outline"
            }
            className="cursor-pointer select-none gap-1.5"
            onClick={() => toggleContentType(ct.value)}
          >
            {ct.value === "ARTICLE" ? <ArticleIcon className="size-3" /> : ct.value === "VIDEO" ? <VideoIcon className="size-3" /> : ct.value === "PODCAST" ? <PodcastIcon className="size-3" /> : <PromptIcon className="size-3" />}
            {ct.label}
          </Badge>
        ))}
        {typesFiltered && (
          <button
            onClick={() => onContentTypesChange([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {onExpandedChange && (
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground w-full sm:w-auto justify-center sm:justify-start"
          >
            {expanded ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
            {expanded ? "Collapse Card" : "Expand Card"}
          </button>
        )}
        <Select
          value={contributor || "__all__"}
          onValueChange={(val) =>
            onContributorChange(val === "__all__" ? "" : val)
          }
        >
          <SelectTrigger className="w-full sm:w-auto" aria-label="Filter by contributor">
            <SelectValue placeholder="All Contributors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Contributors</SelectItem>
            {contributors.map((c) => (
              <SelectItem key={c.email} value={c.email}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-auto" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
