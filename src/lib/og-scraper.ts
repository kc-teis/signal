import ogs from "open-graph-scraper";
import { YOUTUBE_REGEX } from "./constants";

export interface OGResult {
  title: string;
  description: string;
  image: string | null;
  articleImage: string | null;
  articleText: string | null;
  siteName: string | null;
  isYouTube: boolean;
  youtubeId: string | null;
}

function extractArticleText(html: string): string | null {
  // Strip script, style, nav, header, footer tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Replace block elements with newlines, then strip all tags
  text = text
    .replace(/<\/?(p|div|br|h[1-6]|li|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ");

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 20)
    .join("\n")
    .trim();

  // Return first ~3000 chars (enough for GPT to summarize, within token limits)
  return text.length > 50 ? text.slice(0, 3000) : null;
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

    // Extract readable text from article body
    const articleText = extractArticleText(html ?? "");

    const ogOrTwitter = image || twitterImg;

    return {
      title: result.ogTitle || result.dcTitle || "Untitled",
      description: result.ogDescription || result.dcDescription || "",
      image: isYouTube && youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : ogOrTwitter,
      articleImage: ogOrTwitter ? null : articleImage,
      articleText,
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
      articleText: null,
      siteName: null,
      isYouTube,
      youtubeId,
    };
  }
}
