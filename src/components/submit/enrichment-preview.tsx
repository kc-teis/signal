"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import type { EnrichmentPreview as EnrichmentPreviewType } from "@/types";
import { Loader2, ImageIcon } from "lucide-react";

const CONTENT_TYPES = [
  { label: "Article", value: "ARTICLE" },
  { label: "Video", value: "VIDEO" },
] as const;

interface EnrichmentPreviewProps {
  preview: EnrichmentPreviewType;
  onPublish: () => void;
  onBack: () => void;
}

export function EnrichmentPreview({
  preview,
  onPublish,
  onBack,
}: EnrichmentPreviewProps) {
  const [title, setTitle] = useState(preview.title);
  const [summary, setSummary] = useState(preview.summary);
  const [categorySlugs, setCategorySlugs] = useState<string[]>(
    preview.categorySlugs
  );
  const [contentTypes, setContentTypes] = useState<string[]>(
    preview.contentTypes
  );
  const [thumbnailUrl] = useState(preview.thumbnailUrl);
  const [isPublishing, setIsPublishing] = useState(false);
  const [apiError, setApiError] = useState("");

  function toggleCategory(slug: string) {
    setCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function toggleContentType(type: string) {
    setContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handlePublish() {
    setApiError("");
    setIsPublishing(true);

    try {
      const res = await fetch(`/api/links/${preview.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          categorySlugs,
          contentTypes,
          thumbnailUrl,
          contextNote: preview.contextNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Publish failed (${res.status})`);
      }

      onPublish();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt="Thumbnail preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline break-all"
          >
            {preview.url}
          </a>
          <div className="flex flex-wrap gap-1">
            {contentTypes.map((ct) => (
              <Badge key={ct} variant="secondary">
                {ct === "VIDEO" ? "Video" : "Article"}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPublishing}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="summary" className="text-sm font-medium text-foreground">
          Summary
        </label>
        <Textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          disabled={isPublishing}
        />
      </div>

      {preview.contextNote && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Context note
          </p>
          <p className="text-sm italic text-foreground">{preview.contextNote}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.slug}
              variant={categorySlugs.includes(cat.slug) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => !isPublishing && toggleCategory(cat.slug)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Content Type
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTENT_TYPES.map((ct) => (
            <Badge
              key={ct.value}
              variant={
                contentTypes.includes(ct.value) ? "default" : "outline"
              }
              className="cursor-pointer select-none"
              onClick={() => !isPublishing && toggleContentType(ct.value)}
            >
              {ct.label}
            </Badge>
          ))}
        </div>
      </div>

      {apiError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
          className="flex-1"
          size="lg"
        >
          Start Over
        </Button>
        <Button
          onClick={handlePublish}
          disabled={
            isPublishing ||
            !title.trim() ||
            !summary.trim() ||
            categorySlugs.length === 0 ||
            contentTypes.length === 0
          }
          className="flex-1"
          size="lg"
        >
          {isPublishing ? (
            <>
              <Loader2 className="animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </div>
  );
}
