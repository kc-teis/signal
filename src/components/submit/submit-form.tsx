"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getContributorCookies, setContributorCookies } from "@/lib/cookies";
import type { EnrichmentPreview } from "@/types";
import { Loader2 } from "lucide-react";

interface SubmitFormProps {
  onSuccess: (data: EnrichmentPreview) => void;
}

interface FormErrors {
  url?: string;
  contributorName?: string;
  contributorEmail?: string;
}

export function SubmitForm({ onSuccess }: SubmitFormProps) {
  const [url, setUrl] = useState("");
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

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!url.trim()) {
      errs.url = "URL is required";
    } else {
      try {
        new URL(url);
      } catch {
        errs.url = "Please enter a valid URL";
      }
    }
    if (!contributorName.trim()) {
      errs.contributorName = "Name is required";
    }
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
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          contributorName: contributorName.trim(),
          contributorEmail: contributorEmail.trim(),
          ...(contextNote.trim() && { contextNote: contextNote.trim() }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const link = await res.json();

      setContributorCookies(contributorName.trim(), contributorEmail.trim());

      const preview: EnrichmentPreview = {
        id: link.id,
        slug: link.slug,
        title: link.title,
        summary: link.summary,
        categorySlugs: link.categorySlugs ?? [],
        contentTypes: link.contentTypes ?? [],
        thumbnailUrl: link.thumbnailUrl,
        contextNote: link.contextNote ?? null,
        url: link.url,
      };

      onSuccess(preview);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="url" className="text-sm font-medium text-foreground">
          URL
        </label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={!!errors.url}
          disabled={isSubmitting}
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="contributorName"
            className="text-sm font-medium text-foreground"
          >
            Full Name
          </label>
          <Input
            id="contributorName"
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
          <label
            htmlFor="contributorEmail"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="contributorEmail"
            type="email"
            placeholder="jane@athenahealth.com"
            value={contributorEmail}
            onChange={(e) => setContributorEmail(e.target.value)}
            aria-invalid={!!errors.contributorEmail}
            disabled={isSubmitting}
          />
          {errors.contributorEmail && (
            <p className="text-sm text-destructive">
              {errors.contributorEmail}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="contextNote"
          className="text-sm font-medium text-foreground"
        >
          Context Note{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="contextNote"
          placeholder="Why is this worth reading? Any context for your colleagues..."
          value={contextNote}
          onChange={(e) => setContextNote(e.target.value)}
          rows={3}
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
        disabled={isSubmitting || !url.trim() || !contributorName.trim() || !contributorEmail.trim()}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Enriching with AI...
          </>
        ) : (
          "Submit Link"
        )}
      </Button>
    </form>
  );
}
