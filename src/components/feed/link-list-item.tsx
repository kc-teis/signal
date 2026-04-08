"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface LinkListItemProps {
  link: LinkWithCategory;
  index?: number;
}

export function LinkListItem({ link, index = 0 }: LinkListItemProps) {
  function handleCopyPermalink(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/link/${link.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Permalink copied");
    });
  }

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      {link.thumbnailUrl ? (
        <img
          src={link.thumbnailUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/10 to-muted">
          <span className="text-xs font-bold text-primary/30">
            {link.contentTypes.includes("VIDEO") ? "VIDEO" : "ARTICLE"}
          </span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-serif text-sm font-semibold leading-snug line-clamp-1">
              {link.title}
            </h3>
            <p className="mt-0.5 font-serif text-xs text-foreground line-clamp-1">
              {link.summary}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {timeAgo(link.createdAt)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyPermalink}
              className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
            >
              Copy link
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {link.categories.map((cat) => (
              <Badge key={cat.slug} variant="secondary" className="text-[10px] px-1.5 py-0">
                {cat.name}
              </Badge>
            ))}
          </div>
          <span className="font-serif text-xs font-medium text-foreground">
            {link.contributorName}
          </span>
          {link.contextNote && (
            <span className="font-serif text-xs italic text-foreground truncate">
              &mdash; &ldquo;{link.contextNote}&rdquo;
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}
