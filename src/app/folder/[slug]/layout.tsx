import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://signal-git-main-kc-teis-projects.vercel.app";

const STATIC_OG_IMAGE =
  "https://qwjjaoayamykpqymvupx.supabase.co/storage/v1/object/public/thumbnails/og-image-v2.png";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data: folder } = await supabase
    .from("prompt_folders")
    .select("title, description")
    .eq("slug", params.slug)
    .single();

  if (!folder) return { title: "The Signal" };

  const title = folder.title || "The Signal";
  const description =
    folder.description || "A curated prompt collection on The Signal.";

  return {
    title: `${title} — The Signal`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/folder/${params.slug}`,
      images: [{ url: STATIC_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [STATIC_OG_IMAGE],
    },
  };
}

export default function FolderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
