import ogs from "open-graph-scraper";
import { YOUTUBE_REGEX } from "./constants";

export interface OGResult {
  title: string;
  description: string;
  image: string | null;
  articleImage: string | null;
  siteName: string | null;
  isYouTube: boolean;
  youtubeId: string | null;
}

function extractArticleImage(html: string, baseUrl: string): string | null {
  // Match <img> tags with src attributes, skip tiny icons/trackers
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const skipPatterns = /favicon|icon|logo|pixel|tracking|badge|avatar|emoji|1x1|spacer/i;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || skipPatterns.test(src)) continue;
    // Skip data URIs and very short paths (likely icons)
    if (src.startsWith("data:")) continue;
    // Skip SVGs (usually icons/logos)
    if (src.endsWith(".svg")) continue;

    // Resolve relative URLs
    try {
      const resolved = new URL(src, baseUrl).href;
      return resolved;
    } catch {
      continue;
    }
  }

  return null;
}

export async function scrapeOpenGraph(url: string): Promise<OGResult> {
  const youtubeMatch = url.match(YOUTUBE_REGEX);
  const isYouTube = !!youtubeMatch;
  const youtubeId = youtubeMatch?.[1] ?? null;

  try {
    const { result, html } = await ogs({ url, timeout: 10000 });

    const ogImage = result.ogImage as
      | Array<{ url?: string }>
      | { url?: string }
      | undefined;
    const image =
      (Array.isArray(ogImage)
        ? ogImage[0]?.url
        : ogImage?.url) ?? null;

    // Try Twitter card image as secondary source
    const twitterImage = result.twitterImage as
      | Array<{ url?: string }>
      | undefined;
    const twitterImg = twitterImage?.[0]?.url ?? null;

    // Extract first substantial image from article body HTML
    const articleImage = extractArticleImage(html ?? "", url);

    const ogOrTwitter = image || twitterImg;

    return {
      title: result.ogTitle || result.dcTitle || "Untitled",
      description: result.ogDescription || result.dcDescription || "",
      image: isYouTube && youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : ogOrTwitter,
      articleImage: ogOrTwitter ? null : articleImage,
      siteName: result.ogSiteName || null,
      isYouTube,
      youtubeId,
    };
  } catch {
    return {
      title: "Untitled",
      description: "",
      image: isYouTube && youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : null,
      articleImage: null,
      siteName: null,
      isYouTube,
      youtubeId,
    };
  }
}
