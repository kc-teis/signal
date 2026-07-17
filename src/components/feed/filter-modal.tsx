"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleIcon, VideoIcon, PodcastIcon, PromptIcon } from "@/components/icons/content-type-icons";
import { ContributorCombobox } from "@/components/feed/contributor-combobox";
import { X } from "lucide-react";

interface FilterModalProps {
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
  onClose: () => void;
}

const CONTENT_TYPES = [
  { label: "Article", value: "ARTICLE" },
  { label: "Video", value: "VIDEO" },
  { label: "Podcast", value: "PODCAST" },
  { label: "Prompt", value: "PROMPT" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first", description: "Most recently submitted links first" },
  { value: "oldest", label: "Oldest first", description: "Earliest submitted links first" },
] as const;

export function FilterModal({
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
  onClose,
}: FilterModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount/unmount only — depending on onClose directly would re-run this
  // (and re-steal focus via dialogRef.current.focus()) every time the parent
  // re-renders with a new inline onClose function, which happens periodically
  // due to background refetches and made it impossible to type in nested inputs.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedContentTypes.length > 0 ||
    selectedContributors.length > 0 ||
    sort !== "newest";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border bg-background shadow-lg focus:outline-none"
      >
        <div className="flex shrink-0 items-center justify-between p-6 pb-0">
          <h2 id="filter-modal-title" className="text-lg font-semibold">Filter &amp; sort</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-1"
            aria-label="Close filter dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Content type
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Content types">
            <Badge
              variant={selectedContentTypes.length === 0 ? "default" : "outline"}
              className="cursor-pointer select-none rounded-full px-3 py-1"
              role="checkbox"
              aria-checked={selectedContentTypes.length === 0}
              tabIndex={0}
              onClick={() => onContentTypesChange([])}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onContentTypesChange([]);
                }
              }}
            >
              All
            </Badge>
            {CONTENT_TYPES.map((ct) => (
              <Badge
                key={ct.value}
                variant={selectedContentTypes.includes(ct.value) ? "default" : "outline"}
                className="cursor-pointer select-none gap-1.5 rounded-full px-3 py-1"
                role="checkbox"
                aria-checked={selectedContentTypes.includes(ct.value)}
                tabIndex={0}
                onClick={() => toggleContentType(ct.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleContentType(ct.value);
                  }
                }}
              >
                {ct.value === "ARTICLE" ? <ArticleIcon className="size-3" /> : ct.value === "VIDEO" ? <VideoIcon className="size-3" /> : ct.value === "PODCAST" ? <PodcastIcon className="size-3" /> : <PromptIcon className="size-3" />}
                {ct.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
          </label>
          <div className="space-y-2" role="radiogroup" aria-label="Sort order">
            {SORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  sort === opt.value ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={sort === opt.value}
                  onChange={() => onSortChange(opt.value)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
            <Badge
              variant={selectedCategories.length === 0 ? "default" : "outline"}
              className="cursor-pointer select-none rounded-full px-3 py-1"
              role="checkbox"
              aria-checked={selectedCategories.length === 0}
              tabIndex={0}
              onClick={() => onCategoriesChange([])}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCategoriesChange([]);
                }
              }}
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.slug}
                variant={selectedCategories.includes(cat.slug) ? "default" : "outline"}
                className="cursor-pointer select-none rounded-full px-3 py-1"
                role="checkbox"
                aria-checked={selectedCategories.includes(cat.slug)}
                tabIndex={0}
                onClick={() => toggleCategory(cat.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(cat.slug);
                  }
                }}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Contributor
          </label>
          <ContributorCombobox
            contributors={contributors}
            selected={selectedContributors}
            onChange={onContributorsChange}
          />
        </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t p-6 pt-4">
          <button
            onClick={onClear}
            disabled={!hasFilters}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Clear all
          </button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
