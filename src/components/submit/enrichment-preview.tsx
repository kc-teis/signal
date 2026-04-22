"use client";

import { useState, useEffect } from "react";
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
  { label: "Podcast", value: "PODCAST" },
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
  const [thumbnailUrl, setThumbnailUrl] = useState(preview.thumbnailUrl);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [attachedPrompts, setAttachedPrompts] = useState<{ title: string; body: string }[]>([]);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptBody, setNewPromptBody] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      e.preventDefault();
      setIsUploadingThumbnail(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/thumbnails", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        setThumbnailUrl(url);
      } catch {
        // thumbnail stays as-is
      } finally {
        setIsUploadingThumbnail(false);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Publish failed (${res.status})`);
      }

      // Attach prompts to the published link
      if (attachedPrompts.length > 0 && data?.id) {
        await fetch(`/api/prompts?attach=${data.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompts: attachedPrompts }),
        });
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
        <div className="group relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {isUploadingThumbnail ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : thumbnailUrl ? (
            <>
              <Image
                src={thumbnailUrl}
                alt="Thumbnail preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="px-2 text-center text-xs text-white">Paste to replace</p>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="size-6" />
              <p className="px-2 text-center text-xs">⌘V to paste</p>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <a
            href={preview.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline break-all"
          >
            {preview.url}
          </a>
          <div className="flex flex-wrap gap-1">
            {contentTypes.map((ct) => (
              <Badge key={ct} variant="secondary">
                {ct === "VIDEO" ? "Video" : ct === "PODCAST" ? "Podcast" : "Article"}
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
              className={isPublishing ? "cursor-not-allowed opacity-50 select-none" : "cursor-pointer select-none"}
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
              className={isPublishing ? "cursor-not-allowed opacity-50 select-none" : "cursor-pointer select-none"}
              onClick={() => !isPublishing && toggleContentType(ct.value)}
            >
              {ct.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Attached Prompts <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          {!showPromptForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPromptForm(true)}
              disabled={isPublishing}
            >
              Add a Prompt
            </Button>
          )}
        </div>

        {attachedPrompts.map((p, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{p.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-destructive"
                onClick={() => setAttachedPrompts((prev) => prev.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            </div>
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap line-clamp-3">{p.body}</pre>
          </div>
        ))}

        {showPromptForm && (
          <div className="rounded-lg border p-3 space-y-3">
            <Input
              placeholder="Prompt title"
              value={newPromptTitle}
              onChange={(e) => setNewPromptTitle(e.target.value)}
              disabled={isPublishing}
            />
            <Textarea
              placeholder="Paste or write the prompt..."
              value={newPromptBody}
              onChange={(e) => setNewPromptBody(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              disabled={isPublishing}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (newPromptTitle.trim() && newPromptBody.trim()) {
                    setAttachedPrompts((prev) => [...prev, { title: newPromptTitle.trim(), body: newPromptBody.trim() }]);
                    setNewPromptTitle("");
                    setNewPromptBody("");
                    setShowPromptForm(false);
                  }
                }}
                disabled={!newPromptTitle.trim() || !newPromptBody.trim()}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPromptForm(false);
                  setNewPromptTitle("");
                  setNewPromptBody("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
