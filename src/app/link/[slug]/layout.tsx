import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://signal-git-main-kc-teis-projects.vercel.app";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data: link } = await supabase
    .from("links")
    .select("title, summary, thumbnail_url, content_types")
    .eq("slug", params.slug)
    .single();

  if (!link) return { title: "The Signal" };

  const title = link.title || "The Signal";
  const description = link.summary || "Curated articles, videos, and prompts worth your time.";
  const image = link.thumbnail_url || `${siteUrl}/api/og`;

  return {
    title: `${title} — The Signal`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/link/${params.slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function LinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
