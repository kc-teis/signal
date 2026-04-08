"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useContributors } from "@/hooks/use-contributors";
import { useLinks } from "@/hooks/use-links";
import { LinkCard } from "@/components/feed/link-card";
import { LinkCardSkeleton } from "@/components/feed/link-card-skeleton";
import { EditLinkDialog } from "@/components/feed/edit-link-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  decodeEmail,
  getAvatarColor,
  getInitials,
} from "@/lib/contributor-utils";
import type { LinkWithCategory } from "@/types";

export default function ContributorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const email = decodeEmail(id);
  const queryClient = useQueryClient();

  const [editingLink, setEditingLink] = useState<LinkWithCategory | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const { data: contributors, isLoading: loadingContributors } =
    useContributors();
  const contributor = contributors?.find((c) => c.email === email);

  const { data: linksData, isLoading: loadingLinks } = useLinks({
    contributor: email,
  });

  const isLoading = loadingContributors || loadingLinks;

  function invalidateLinks() {
    queryClient.invalidateQueries({ queryKey: ["links"] });
    queryClient.invalidateQueries({ queryKey: ["contributors"] });
  }

  async function handleDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/links/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Link deleted");
      invalidateLinks();
    } catch {
      toast.error("Failed to delete link");
    } finally {
      setDeletingSlug(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Link
          href="/contributors"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Contributors
        </Link>
        <div className="flex items-center gap-5">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LinkCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const name = contributor?.name ?? email;
  const initials = getInitials(name);
  const colorClass = getAvatarColor(email);
  const linkCount = linksData?.total ?? contributor?.linkCount ?? 0;
  const links = linksData?.links ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/contributors"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; Back to Contributors
      </Link>

      <div className="flex items-center gap-5">
        <div
          className={`flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${colorClass}`}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {linkCount} {linkCount === 1 ? "submission" : "submissions"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Submitted Links</h2>
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <p className="text-lg font-medium text-foreground">
              No links found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {links.map((link, index) => (
                <div key={link.id} className="relative group/manage">
                  <LinkCard link={link} index={index} />
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover/manage:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingLink(link);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs shadow-sm"
                      disabled={deletingSlug === link.slug}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this link? This cannot be undone.")) {
                          handleDelete(link.slug);
                        }
                      }}
                    >
                      {deletingSlug === link.slug ? "..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          onSave={() => {
            setEditingLink(null);
            invalidateLinks();
          }}
          onCancel={() => setEditingLink(null)}
        />
      )}
    </div>
  );
}
