"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useLinkBySlug } from "@/hooks/use-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { YOUTUBE_REGEX } from "@/lib/constants";

function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LinkDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { data: link, isLoading, error } = useLinkBySlug(slug);

  function handleCopyPermalink() {
    const url = `${window.location.origin}/link/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Permalink copied to clipboard");
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center py-16">
        <p className="text-lg font-medium">Link not found</p>
        <Link href="/">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  const youtubeId = link.contentTypes.includes("VIDEO")
    ? extractYouTubeId(link.url)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Feed
      </Link>

      {youtubeId ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={link.title ?? ""}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : link.thumbnailUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <img
            src={link.thumbnailUrl}
            alt={link.title ?? "Link thumbnail"}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center">
          <span className="text-5xl font-bold text-primary/20 select-none">
            {link.contentTypes.includes("VIDEO") ? "VIDEO" : "ARTICLE"}
          </span>
        </div>
      )}

      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight">{link.title}</h1>

        <div className="flex flex-wrap items-center gap-3">
          {link.categories.map((cat) => (
            <Badge key={cat.slug} variant="secondary">
              {cat.name}
            </Badge>
          ))}
          {link.contentTypes.map((ct) => (
            <span key={ct} className="text-sm text-muted-foreground">
              {ct === "VIDEO" ? "Video" : "Article"}
            </span>
          ))}
        </div>

        <p className="font-serif text-base leading-relaxed text-muted-foreground">
          {link.summary}
        </p>

        {link.contextNote && (
          <div className="rounded-lg border bg-muted/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Context from contributor
            </p>
            <p className="text-sm text-foreground">{link.contextNote}</p>
          </div>
        )}

        <div className="flex flex-col gap-1 text-sm">
          <span className="text-foreground font-medium">
            {link.contributorName}
          </span>
          <span className="text-muted-foreground">{link.contributorEmail}</span>
          <span className="text-muted-foreground">
            Submitted {formatDate(link.createdAt)}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>Open Original</Button>
          </a>
          <Button variant="outline" onClick={handleCopyPermalink}>
            Copy Permalink
          </Button>
        </div>
      </div>
    </div>
  );
}
