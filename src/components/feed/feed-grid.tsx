"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { LinkCard } from "./link-card";
import { LinkListItem } from "./link-list-item";
import { LinkCardSkeleton } from "./link-card-skeleton";
import { SignalLoader } from "@/components/ui/signal-loader";
import type { LinkWithCategory } from "@/types";

export type ViewMode = "grid" | "list";

interface FeedGridProps {
  links: LinkWithCategory[];
  isLoading: boolean;
  viewMode?: ViewMode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function FeedGrid({
  links,
  isLoading,
  viewMode = "grid",
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: FeedGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LinkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-lg font-medium text-foreground">No links found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters, or submit a link to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {links.map((link, index) => (
              <LinkListItem key={link.id} link={link} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {links.map((link, index) => (
              <LinkCard key={link.id} link={link} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite scroll sentinel + loader */}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isFetchingNextPage && <SignalLoader size={48} />}
      </div>
    </>
  );
}
