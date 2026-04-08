"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleIcon, VideoIcon } from "@/components/icons/content-type-icons";
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
}

export function LinkCard({ link, index }: LinkCardProps) {
  function handleCopyPermalink(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/link/${link.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Permalink copied to clipboard");
    });
  }

  function handleCardClick() {
    window.open(link.url, "_blank", "noopener,noreferrer");
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={handleCardClick}
      className="group grid h-full cursor-pointer grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 hover:shadow-lg"
    >
      {link.thumbnailUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={link.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center">
          <span className="text-4xl font-bold text-primary/20 select-none">
            {link.contentTypes.includes("VIDEO") ? "VIDEO" : "ARTICLE"}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {link.categories.slice(0, 2).map((cat) => (
              <Badge key={cat.slug} variant="secondary" className="shrink-0">
                {cat.name}
              </Badge>
            ))}
            {link.categories.length > 2 && (
              <span className="shrink-0 text-xs text-muted-foreground" title={link.categories.slice(2).map(c => c.name).join(", ")}>
                +{link.categories.length - 2} more
              </span>
            )}
            {link.contentTypes.map((ct) => (
              <span
                key={ct}
                className="shrink-0 text-muted-foreground"
                title={ct === "VIDEO" ? "Video" : "Article"}
              >
                {ct === "VIDEO" ? <VideoIcon /> : <ArticleIcon />}
              </span>
            ))}
          </div>
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug">
          {link.title}
        </h3>

        <p className="font-serif text-sm text-muted-foreground leading-relaxed">
          {link.summary}
        </p>

        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyPermalink}
            className="mb-2 text-muted-foreground hover:text-foreground"
          >
            Copy link
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 min-h-[5.5rem] flex flex-col justify-center rounded-b-xl" style={{ backgroundColor: "#4E2D82" }}>
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm font-medium text-background">
            {link.contributorName}
          </span>
          <span className="shrink-0 text-xs font-bold text-white/60">
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
