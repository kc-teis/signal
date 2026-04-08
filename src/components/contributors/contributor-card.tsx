"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ContributorSummary } from "@/types";
import {
  encodeEmail,
  getAvatarColor,
  getInitials,
  timeAgo,
} from "@/lib/contributor-utils";

interface ContributorCardProps {
  contributor: ContributorSummary;
  index?: number;
}

export function ContributorCard({ contributor, index = 0 }: ContributorCardProps) {
  const initials = getInitials(contributor.name);
  const colorClass = getAvatarColor(contributor.email);
  const encodedEmail = encodeEmail(contributor.email);

  return (
    <Link href={`/contributors/${encodedEmail}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="group cursor-pointer overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:ring-foreground/20 hover:shadow-lg"
      >
        <div className="flex items-center gap-4 p-5">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${colorClass}`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold leading-snug">
              {contributor.name}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {contributor.email}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant="secondary">
              {contributor.linkCount} {contributor.linkCount === 1 ? "link" : "links"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Latest: {timeAgo(contributor.latestSubmission)}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
