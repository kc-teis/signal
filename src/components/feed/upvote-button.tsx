"use client";

import { useEffect, useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateDeviceId } from "@/lib/cookies";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  slug: string;
  count: number;
  hasUpvoted: boolean;
  className?: string;
}

export function UpvoteButton({ slug, count, hasUpvoted, className }: UpvoteButtonProps) {
  const [localCount, setLocalCount] = useState(count);
  const [localHasUpvoted, setLocalHasUpvoted] = useState(hasUpvoted);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure the anonymous device cookie exists before the first click needs it.
  useEffect(() => {
    getOrCreateDeviceId();
  }, []);

  useEffect(() => {
    setLocalCount(count);
    setLocalHasUpvoted(hasUpvoted);
  }, [count, hasUpvoted]);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (isSubmitting) return;

    const prevCount = localCount;
    const prevHasUpvoted = localHasUpvoted;
    setLocalHasUpvoted(!prevHasUpvoted);
    setLocalCount(prevHasUpvoted ? prevCount - 1 : prevCount + 1);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/links/${slug}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("Upvote failed");
      const data = await res.json();
      setLocalCount(data.upvoteCount);
      setLocalHasUpvoted(data.upvoted);
    } catch {
      setLocalCount(prevCount);
      setLocalHasUpvoted(prevHasUpvoted);
      toast.error("Failed to record upvote");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={localHasUpvoted}
      aria-label={localHasUpvoted ? "Remove upvote" : "Upvote"}
      className={cn(
        "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        localHasUpvoted
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        className
      )}
    >
      <ArrowBigUp className={cn("size-3.5", localHasUpvoted && "fill-current")} />
      {localCount}
    </button>
  );
}
