"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/constants";
import type { LinkWithCategory } from "@/types";

interface EditLinkDialogProps {
  link: LinkWithCategory;
  onSave: () => void;
  onCancel: () => void;
}

export function EditLinkDialog({ link, onSave, onCancel }: EditLinkDialogProps) {
  const [title, setTitle] = useState(link.title ?? "");
  const [summary, setSummary] = useState(link.summary ?? "");
  const [contextNote, setContextNote] = useState(link.contextNote ?? "");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(
    link.categorySlugs ?? []
  );
  const [contentTypes, setContentTypes] = useState<string[]>(
    link.contentTypes ?? []
  );
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    },
    [saving, onCancel]
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [handleEscape]);

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

  async function handleSave() {
    if (!title.trim() || !summary.trim() || categorySlugs.length === 0 || contentTypes.length === 0) {
      toast.error("Title, summary, at least one category, and one content type are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/links/${link.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          categorySlugs,
          contentTypes,
          thumbnailUrl: link.thumbnailUrl,
          contextNote: contextNote || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Link updated");
      onSave();
    } catch {
      toast.error("Failed to update link");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !saving) onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 id="edit-dialog-title" className="text-lg font-semibold">Edit Link</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
            aria-label="Close dialog"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-muted-foreground truncate">{link.url}</p>

        <div className="space-y-1.5">
          <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-summary" className="text-sm font-medium">Summary</label>
          <Textarea
            id="edit-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-context" className="text-sm font-medium">Context Note</label>
          <Input
            id="edit-context"
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            placeholder="Optional note for context"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categories</label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.slug}
                variant={categorySlugs.includes(cat.slug) ? "default" : "outline"}
                className="cursor-pointer select-none"
                role="checkbox"
                aria-checked={categorySlugs.includes(cat.slug)}
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Content Type</label>
          <div className="flex gap-2" role="group" aria-label="Content types">
            {(["ARTICLE", "VIDEO"] as const).map((type) => (
              <Badge
                key={type}
                variant={contentTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer select-none"
                role="checkbox"
                aria-checked={contentTypes.includes(type)}
                tabIndex={0}
                onClick={() => toggleContentType(type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleContentType(type);
                  }
                }}
              >
                {type === "ARTICLE" ? "Article" : "Video"}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
