"use client";

import { useState } from "react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Link</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-muted-foreground truncate">{link.url}</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Summary</label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Context Note</label>
          <Input
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            placeholder="Optional note for context"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.slug}
                variant={categorySlugs.includes(cat.slug) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleCategory(cat.slug)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Content Type</label>
          <div className="flex gap-2">
            {(["ARTICLE", "VIDEO"] as const).map((type) => (
              <Badge
                key={type}
                variant={contentTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleContentType(type)}
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
