"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import { getContributorCookies, setContributorCookies } from "@/lib/cookies";
import { Loader2 } from "lucide-react";

interface PromptSubmitFormProps {
  onSuccess: () => void;
}

interface FormErrors {
  title?: string;
  body?: string;
  categories?: string;
  contributorName?: string;
  contributorEmail?: string;
}

export function PromptSubmitForm({ onSuccess }: PromptSubmitFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const cookies = getContributorCookies();
    if (cookies.name) setContributorName(cookies.name);
    if (cookies.email) setContributorEmail(cookies.email);
  }, []);

  function toggleCategory(slug: string) {
    setCategorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!body.trim()) errs.body = "Prompt body is required";
    if (categorySlugs.length === 0) errs.categories = "Select at least one category";
    if (!contributorName.trim()) errs.contributorName = "Name is required";
    if (!contributorEmail.trim()) {
      errs.contributorEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail)) {
      errs.contributorEmail = "Please enter a valid email";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          categorySlugs,
          contributorName: contributorName.trim(),
          contributorEmail: contributorEmail.trim(),
          ...(contextNote.trim() && { contextNote: contextNote.trim() }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setContributorCookies(contributorName.trim(), contributorEmail.trim());
      onSuccess();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="prompt-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="prompt-name"
            placeholder="Jane Smith"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            aria-invalid={!!errors.contributorName}
            disabled={isSubmitting}
          />
          {errors.contributorName && (
            <p className="text-sm text-destructive">{errors.contributorName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prompt-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="prompt-email"
            type="email"
            placeholder="jane@athenahealth.com"
            value={contributorEmail}
            onChange={(e) => setContributorEmail(e.target.value)}
            aria-invalid={!!errors.contributorEmail}
            disabled={isSubmitting}
          />
          {errors.contributorEmail && (
            <p className="text-sm text-destructive">{errors.contributorEmail}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="prompt-title" className="text-sm font-medium text-foreground">
          Prompt Title
        </label>
        <Input
          id="prompt-title"
          placeholder="e.g., Code Review Assistant"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="prompt-body" className="text-sm font-medium text-foreground">
          Prompt
        </label>
        <Textarea
          id="prompt-body"
          placeholder="Paste or write your prompt here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="font-mono text-sm"
          aria-invalid={!!errors.body}
          disabled={isSubmitting}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Categories</label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.slug}
              variant={categorySlugs.includes(cat.slug) ? "default" : "outline"}
              className="cursor-pointer select-none"
              role="checkbox"
              aria-checked={categorySlugs.includes(cat.slug)}
              tabIndex={0}
              onClick={() => !isSubmitting && toggleCategory(cat.slug)}
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
        {errors.categories && <p className="text-sm text-destructive">{errors.categories}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="prompt-context" className="text-sm font-medium text-foreground">
          Context Note{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="prompt-context"
          placeholder="When is this prompt most useful? Any tips..."
          value={contextNote}
          onChange={(e) => setContextNote(e.target.value)}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {apiError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !title.trim() || !body.trim() || categorySlugs.length === 0 || !contributorName.trim() || !contributorEmail.trim()}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Publishing...
          </>
        ) : (
          "Publish Prompt"
        )}
      </Button>
    </form>
  );
}
