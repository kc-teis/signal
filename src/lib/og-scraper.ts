import ogs from "open-graph-scraper";
import { YOUTUBE_REGEX, SPOTIFY_EPISODE_REGEX, APPLE_PODCAST_REGEX, PODCAST_URL_PATTERNS } from "./constants";

export interface OGResult {
  title: string;
  description: string;
  image: string | null;
  articleImage: string | null;
  articleText: string | null;
  siteName: string | null;
  isYouTube: boolean;
  youtubeId: string | null;
  isPodcast: boolean;
  spotifyEpisodeId: string | null;
  applePodcastId: string | null;
  audioUrl: string | null;
  podcastMeta: {
    showName: string | null;
    duration: string | null;
  } | null;
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

function detectPodcast(url: string, ogType?: string): boolean {
  if (PODCAST_URL_PATTERNS.some((p) => p.test(url))) return true;
  if (ogType && /music|audio|podcast/i.test(ogType)) return true;
  return false;
}

function extractDuration(html: string): string | null {
  // Look for common duration patterns in metadata or structured data
  const metaMatch = html.match(/(?:duration|length)["':\s]+(\d+:\d{2}(?::\d{2})?)/i);
  if (metaMatch) return metaMatch[1];
  // JSON-LD duration (ISO 8601)
  const isoMatch = html.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (isoMatch) {
    const h = isoMatch[1] ? `${isoMatch[1]}:` : "";
    const m = isoMatch[2] ?? "0";
    const s = (isoMatch[3] ?? "0").padStart(2, "0");
    return `${h}${m}:${s}`;
  }
  return null;
}

export async function scrapeOpenGraph(url: string): Promise<OGResult> {
  const youtubeMatch = url.match(YOUTUBE_REGEX);
  const isYouTube = !!youtubeMatch;
  const youtubeId = youtubeMatch?.[1] ?? null;

  const spotifyMatch = url.match(SPOTIFY_EPISODE_REGEX);
  const spotifyEpisodeId = spotifyMatch?.[1] ?? null;

  const appleMatch = url.match(APPLE_PODCAST_REGEX);
  const applePodcastId = appleMatch ? `${appleMatch[1]}?i=${appleMatch[2]}` : null;

  try {
    const { result, html } = await ogs({ url, timeout: 10000 });

    const ogType = (result as Record<string, unknown>).ogType as string | undefined;
    const isPodcast = detectPodcast(url, ogType);

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

    // Extract audio URL from og:audio or meta tags
    const ogAudio = (result as Record<string, unknown>).ogAudio as string | undefined;
    const audioUrl = ogAudio || null;

    // Podcast episode metadata
    const podcastMeta = isPodcast
      ? {
          showName: result.ogSiteName || null,
          duration: extractDuration(html ?? ""),
        }
      : null;

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
      isPodcast,
      spotifyEpisodeId,
      applePodcastId,
      audioUrl,
      podcastMeta,
    };
  } catch {
    const isPodcast = detectPodcast(url);
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
      isPodcast,
      spotifyEpisodeId,
      applePodcastId,
      audioUrl: null,
      podcastMeta: null,
    };
  }
}
