"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, X, Loader2, Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import type { PromptFolderWithDetails, FolderPrompt } from "@/types";

interface EditablePrompt {
  id: string | null; // null = new, not yet saved
  title: string;
  body: string;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PromptCard({ prompt }: { prompt: FolderPrompt }) {
  const [expanded, setExpanded] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.body).then(() => {
      toast.success("Prompt copied to clipboard");
    });
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors text-left"
      >
        <span className="text-sm font-medium">{prompt.title}</span>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
            Copy prompt
          </Button>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {expanded && (
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto bg-muted/30">
          {prompt.body}
        </pre>
      )}
    </div>
  );
}

function EditPromptRow({
  prompt,
  onChange,
  onRemove,
}: {
  prompt: EditablePrompt;
  onChange: (field: "title" | "body", value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={prompt.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Prompt title"
          className="h-7 text-sm font-medium"
        />
        <button type="button" onClick={onRemove} className="shrink-0">
          <X className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>
      <Textarea
        value={prompt.body}
        onChange={(e) => onChange("body", e.target.value)}
        rows={4}
        className="font-mono text-xs"
        placeholder="Prompt body..."
      />
    </div>
  );
}

export default function FolderDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [folder, setFolder] = useState<PromptFolderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategorySlugs, setEditCategorySlugs] = useState<string[]>([]);
  const [editPrompts, setEditPrompts] = useState<EditablePrompt[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptBody, setNewPromptBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/prompt-folders/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setFolder(data);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  function enterEditMode() {
    if (!folder) return;
    setEditTitle(folder.title);
    setEditDescription(folder.description ?? "");
    setEditCategorySlugs([...folder.categorySlugs]);
    setEditPrompts(
      folder.prompts.map((p) => ({ id: p.id, title: p.title, body: p.body }))
    );
    setSaveError("");
    setShowAddForm(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError("");
    setShowAddForm(false);
    setNewPromptTitle("");
    setNewPromptBody("");
  }

  function toggleCategory(slug: string) {
    setEditCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function updatePrompt(index: number, field: "title" | "body", value: string) {
    setEditPrompts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function removePrompt(index: number) {
    setEditPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  function commitNewPrompt() {
    if (!newPromptTitle.trim() || !newPromptBody.trim()) return;
    setEditPrompts((prev) => [
      ...prev,
      { id: null, title: newPromptTitle.trim(), body: newPromptBody.trim() },
    ]);
    setNewPromptTitle("");
    setNewPromptBody("");
    setShowAddForm(false);
  }

  async function handleSave() {
    if (!editTitle.trim() || editCategorySlugs.length === 0 || editPrompts.length === 0) {
      setSaveError("Title, at least one category, and at least one prompt are required.");
      return;
    }

    setSaveError("");
    setIsSaving(true);

    try {
      const res = await fetch(`/api/prompt-folders/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          categorySlugs: editCategorySlugs,
          prompts: editPrompts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }

      // Reload folder data
      const fresh = await fetch(`/api/prompt-folders/${slug}`);
      const data = await fresh.json();
      setFolder(data);
      setEditing(false);
      toast.success("Collection updated");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyPermalink() {
    const url = `${window.location.origin}/folder/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Permalink copied to clipboard");
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-48 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (loadError || !folder) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center py-16">
        <p className="text-lg font-medium">Collection not found</p>
        <Link href="/"><Button variant="outline">Back to Feed</Button></Link>
      </div>
    );
  }

  const categoryNames = CATEGORIES.filter((c) => folder.categorySlugs.includes(c.slug));

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Collection</h1>
          <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
            Cancel
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} disabled={isSaving} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categories <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.slug}
                variant={editCategorySlugs.includes(cat.slug) ? "default" : "outline"}
                className={isSaving ? "cursor-not-allowed opacity-50 select-none" : "cursor-pointer select-none"}
                onClick={() => !isSaving && toggleCategory(cat.slug)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">
            Prompts <span className="text-destructive">*</span>
          </label>

          {editPrompts.map((prompt, i) => (
            <EditPromptRow
              key={prompt.id ?? `new-${i}`}
              prompt={prompt}
              onChange={(field, value) => updatePrompt(i, field, value)}
              onRemove={() => removePrompt(i)}
            />
          ))}

          {showAddForm ? (
            <div className="rounded-lg border p-3 space-y-2">
              <Input
                placeholder="Prompt title"
                value={newPromptTitle}
                onChange={(e) => setNewPromptTitle(e.target.value)}
                className="h-7 text-sm"
                disabled={isSaving}
              />
              <Textarea
                placeholder="Prompt body..."
                value={newPromptBody}
                onChange={(e) => setNewPromptBody(e.target.value)}
                rows={4}
                className="font-mono text-xs"
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={commitNewPrompt}
                  disabled={!newPromptTitle.trim() || !newPromptBody.trim()}
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewPromptTitle("");
                    setNewPromptBody("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
              disabled={isSaving}
            >
              <Plus className="size-4" />
              Add prompt
            </button>
          )}
        </div>

        {saveError && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={cancelEdit} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? <><Loader2 className="animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground">
        &larr; Back to Feed
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categoryNames.map((cat) => (
            <Badge key={cat.slug} variant="secondary">{cat.name}</Badge>
          ))}
          <Badge variant="outline">
            {folder.prompts.length} prompt{folder.prompts.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <h1 className="font-serif text-2xl font-bold tracking-tight">{folder.title}</h1>

        {folder.description && (
          <p className="font-serif text-base leading-relaxed text-muted-foreground">
            {folder.description}
          </p>
        )}

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-foreground font-medium">{folder.contributorName}</span>
          <span className="text-muted-foreground">{folder.contributorEmail}</span>
          <span className="text-muted-foreground">Submitted {formatDate(folder.createdAt)}</span>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={handleCopyPermalink}>Copy Permalink</Button>
          <Button variant="outline" onClick={enterEditMode}>Edit Collection</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Prompts</h2>
        {folder.prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}
