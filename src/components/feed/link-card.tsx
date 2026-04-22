"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleIcon, VideoIcon, PodcastIcon, PromptIcon } from "@/components/icons/content-type-icons";
import { FolderOpen } from "lucide-react";
import type { LinkWithCategory } from "@/types";

function timeAgo(date: string | Date): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

interface LinkCardProps {
  link: LinkWithCategory;
  index: number;
  lastVisit?: Date | null;
}

export function LinkCard({ link, index, lastVisit }: LinkCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const isPrompt = link.contentTypes.includes("PROMPT") && !link.url;
  const isFolder = link.contentTypes.includes("PROMPT_FOLDER");
  const isNew = Boolean(
    lastVisit &&
      (new Date(link.updatedAt).getTime() > lastVisit.getTime() ||
        new Date(link.createdAt).getTime() > lastVisit.getTime())
  );

  async function handleCopyAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (isPrompt) {
      try {
        const res = await fetch(`/api/prompts?link_id=${link.id}`);
        const prompts = await res.json();
        const body = Array.isArray(prompts) && prompts.length > 0 ? prompts[0].body : link.summary;
        await navigator.clipboard.writeText(body ?? "");
        toast.success("Prompt copied to clipboard");
      } catch {
        await navigator.clipboard.writeText(link.summary ?? "");
        toast.success("Prompt copied to clipboard");
      }
    } else {
      const base = isFolder ? `/folder/${link.slug}` : `/link/${link.slug}`;
      navigator.clipboard.writeText(`${window.location.origin}${base}`).then(() => {
        toast.success("Permalink copied to clipboard");
      });
    }
  }

  function handleCardClick() {
    if (isFolder) {
      window.location.href = `/folder/${link.slug}`;
    } else if (link.url) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = `/link/${link.slug}`;
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleCardClick}
      className="group grid h-full cursor-pointer grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 hover:shadow-lg"
    >
      {isFolder ? (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-violet-500/15 via-violet-400/10 to-muted flex flex-col items-center justify-center gap-2">
          <FolderOpen className="size-10 text-violet-500/40" />
          <span className="text-sm font-medium text-muted-foreground">
            {link.summary?.match(/\d+/)?.[0] ?? ""} prompts
          </span>
        </div>
      ) : link.contentTypes.includes("PROMPT") && !link.thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-muted">
          <pre className="absolute inset-0 px-3 pt-3 overflow-hidden text-[11px] font-mono text-foreground/50 leading-snug whitespace-pre-wrap select-none">
            {link.promptBody ?? link.summary}
          </pre>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted to-transparent" />
          <PromptIcon className="absolute bottom-2 right-2 size-4 text-emerald-600/30" />
        </div>
      ) : link.thumbnailUrl && !imgError ? (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={link.thumbnailUrl}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center">
          <span className="text-4xl font-bold text-primary/20 select-none">
            {link.contentTypes.includes("VIDEO") ? "VIDEO" : link.contentTypes.includes("PODCAST") ? "PODCAST" : "ARTICLE"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {(showAllCategories ? link.categories : link.categories.slice(0, 2)).map((cat) => (
              <Badge key={cat.slug} variant="secondary" className="shrink-0">
                {cat.name}
              </Badge>
            ))}
            {link.categories.length > 2 && !showAllCategories && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowAllCategories(true); }}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                +{link.categories.length - 2} more
              </button>
            )}
            {link.contentTypes.map((ct) => (
              <span
                key={ct}
                className="shrink-0 text-muted-foreground"
                title={ct === "VIDEO" ? "Video" : ct === "PODCAST" ? "Podcast" : ct === "PROMPT" ? "Prompt" : ct === "PROMPT_FOLDER" ? "Prompt Collection" : "Article"}
              >
                {ct === "VIDEO" ? <VideoIcon /> : ct === "PODCAST" ? <PodcastIcon /> : ct === "PROMPT" ? <PromptIcon /> : ct === "PROMPT_FOLDER" ? <FolderOpen className="size-4" /> : <ArticleIcon />}
              </span>
            ))}
          </div>
          {isNew && (
            <Badge variant="default" className="shrink-0">
              New content updated
            </Badge>
          )}
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug">
          {link.title}
        </h3>

        <p className="font-serif text-sm text-muted-foreground leading-relaxed">
          {link.summary}
        </p>

        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAction}
            className="mb-2 text-muted-foreground hover:text-foreground"
          >
            {isPrompt ? "Copy prompt" : "Copy link"}
          </Button>
          {(link.promptCount ?? 0) > 0 && (
            <span className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <PromptIcon className="size-3" />
              {link.promptCount} {link.promptCount === 1 ? "prompt" : "prompts"}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 min-h-[5.5rem] flex flex-col justify-center rounded-b-xl" style={{ backgroundColor: "#4E2D82" }}>
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-medium text-background">
            {link.contributorName}
          </span>
          <span className="shrink-0 text-xs font-bold text-white/80">
            {timeAgo(link.createdAt)}
          </span>
        </div>
        {link.contextNote && (
          <p className="mt-0.5 font-serif text-sm font-bold italic text-background/90">
            &ldquo;{link.contextNote}&rdquo;
          </p>
        )}
      </div>
    </motion.article>
  );
}
