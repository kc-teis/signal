"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/constants";
import type { PromptFolderWithDetails, FolderPrompt } from "@/types";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PromptCard({ prompt }: { prompt: FolderPrompt }) {
  function handleCopy() {
    navigator.clipboard.writeText(prompt.body).then(() => {
      toast.success("Prompt copied to clipboard");
    });
  }

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-sm font-medium">{prompt.title}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
          Copy prompt
        </Button>
      </div>
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {prompt.body}
      </pre>
    </div>
  );
}

export default function FolderDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [folder, setFolder] = useState<PromptFolderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/prompt-folders/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setFolder(data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

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

  if (error || !folder) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center py-16">
        <p className="text-lg font-medium">Collection not found</p>
        <Link href="/">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  const categoryNames = CATEGORIES.filter((c) =>
    folder.categorySlugs.includes(c.slug)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Feed
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categoryNames.map((cat) => (
            <Badge key={cat.slug} variant="secondary">
              {cat.name}
            </Badge>
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
          <span className="text-muted-foreground">
            Submitted {formatDate(folder.createdAt)}
          </span>
        </div>

        <div className="pt-1">
          <Button variant="outline" onClick={handleCopyPermalink}>
            Copy Permalink
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Prompts
        </h2>
        {folder.prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}
