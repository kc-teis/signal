"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLinks } from "@/hooks/use-links";
import { LinkCard } from "@/components/feed/link-card";
import { LinkCardSkeleton } from "@/components/feed/link-card-skeleton";
import { EditLinkDialog } from "@/components/feed/edit-link-dialog";
import { Button } from "@/components/ui/button";
import { getContributorCookies } from "@/lib/cookies";
import { getAvatarColor, getInitials } from "@/lib/contributor-utils";
import type { LinkWithCategory } from "@/types";

export default function MySubmissionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [editingLink, setEditingLink] = useState<LinkWithCategory | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    const cookies = getContributorCookies();
    if (!cookies.email) {
      router.replace("/submit");
      return;
    }
    setEmail(cookies.email);
    setName(cookies.name);
  }, [router]);

  const { data, isLoading } = useLinks(
    email ? { contributor: email } : { contributor: "" }
  );

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

  if (!email) return null;

  const initials = getInitials(name || email);
  const colorClass = getAvatarColor(email);
  const links = data?.pages.flatMap((page) => page.links) ?? [];
  const linkCount = data?.pages[0]?.total ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        <div
          className={`flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${colorClass}`}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {name || email}
          </h1>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {linkCount} {linkCount === 1 ? "submission" : "submissions"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LinkCardSkeleton key={i} />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No submissions yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Links you submit will appear here for editing.
          </p>
          <a href="/submit" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Submit your first link
          </a>
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
                      if (link.contentTypes.includes("PROMPT_FOLDER")) {
                        window.location.href = `/folder/${link.slug}?edit=true`;
                      } else {
                        setEditingLink(link);
                      }
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
                      if (
                        confirm("Delete this link? This cannot be undone.")
                      ) {
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
