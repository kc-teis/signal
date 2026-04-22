"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import { Loader2, FolderOpen, X } from "lucide-react";

interface ParsedPrompt {
  filename: string;
  title: string;
  body: string;
}

interface PromptFolderSubmitFormProps {
  onSuccess: () => void;
}

export function PromptFolderSubmitForm({ onSuccess }: PromptFolderSubmitFormProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [folderTitle, setFolderTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<ParsedPrompt[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleCategory(slug: string) {
    setCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function updatePrompt(index: number, field: "title" | "body", value: string) {
    setPrompts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  function removePrompt(index: number) {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".txt")
    );
    if (!files.length) {
      setError("No .md or .txt files found in that folder. Please select a folder containing prompt files in one of those formats.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsEnriching(true);
    setError("");

    const fileData = await Promise.all(
      files.map(async (file) => ({
        filename: file.name.replace(/\.(md|txt)$/, ""),
        content: await file.text(),
      }))
    );

    const enriched = await Promise.all(
      fileData.map(async ({ filename, content }) => {
        try {
          const res = await fetch("/api/prompt-folders/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, content }),
          });
          const data = await res.json();
          return { filename, title: data.title || filename, body: content };
        } catch {
          return { filename, title: filename, body: content };
        }
      })
    );

    setPrompts(enriched);
    setIsEnriching(false);
    setStep("preview");

    // Reset the file input so the same folder can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (
      !folderTitle.trim() ||
      !contributorName.trim() ||
      !contributorEmail.trim() ||
      categorySlugs.length === 0 ||
      prompts.length === 0
    ) {
      setError("Please fill in all required fields and select at least one category.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/prompt-folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: folderTitle,
          description,
          categorySlugs,
          contributorName,
          contributorEmail,
          prompts: prompts.map((p) => ({ title: p.title, body: p.body })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Submission failed");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Your Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Your Email <span className="text-destructive">*</span>
            </label>
            <Input
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              placeholder="jane@example.com"
              type="email"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={isEnriching}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 py-14 transition-colors hover:border-muted-foreground/50 disabled:cursor-not-allowed"
        >
          {isEnriching ? (
            <>
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Enriching prompts with AI...</p>
            </>
          ) : (
            <>
              <FolderOpen className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Select a folder of prompts</p>
                <p className="mt-1 text-xs text-muted-foreground">.md and .txt files · AI will generate titles</p>
              </div>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          // @ts-expect-error webkitdirectory not in React types
          webkitdirectory=""
          multiple
          accept=".md,.txt"
          className="hidden"
          onChange={handleFolderSelect}
        />

        {error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Collection Title <span className="text-destructive">*</span>
        </label>
        <Input
          value={folderTitle}
          onChange={(e) => setFolderTitle(e.target.value)}
          placeholder="e.g. Prompt Engineering Fundamentals"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="A brief description of this collection..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Categories <span className="text-destructive">*</span>
        </label>
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {prompts.length} Prompt{prompts.length !== 1 ? "s" : ""}
          </label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setStep("upload")}
          >
            Change folder
          </button>
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {prompts.map((prompt, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={prompt.title}
                  onChange={(e) => updatePrompt(i, "title", e.target.value)}
                  className="h-7 text-sm font-medium"
                />
                <button type="button" onClick={() => removePrompt(i)}>
                  <X className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
              <Textarea
                value={prompt.body}
                onChange={(e) => updatePrompt(i, "body", e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || prompts.length === 0}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Publishing...
          </>
        ) : (
          `Publish ${prompts.length} Prompt${prompts.length !== 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
}
