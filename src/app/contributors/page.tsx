"use client";

import { AnimatePresence } from "framer-motion";
import { useContributors } from "@/hooks/use-contributors";
import { ContributorCard } from "@/components/contributors/contributor-card";
import { Skeleton } from "@/components/ui/skeleton";

function ContributorCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-center gap-4 p-5">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ContributorsPage() {
  const { data: contributors, isLoading } = useContributors();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contributors</h1>
        <p className="text-sm text-muted-foreground">
          People sharing knowledge with the team.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ContributorCardSkeleton key={i} />
          ))}
        </div>
      ) : !contributors?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No contributors yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contributors will appear here once links are submitted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {contributors.map((contributor, index) => (
              <ContributorCard
                key={contributor.email}
                contributor={contributor}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
