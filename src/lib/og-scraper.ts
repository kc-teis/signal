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
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  // Replace block elements with newlines, then strip all tags
  text = text
    .replace(/<\/?(p|div|br|h[1-6]|li|blockquote|article|section)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ");

  // Clean up whitespace and split into lines
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 10); // Shorter minimum to capture more content

  // Find the main content area (usually the longest continuous block of text)
  let bestBlock = "";
  let currentBlock = "";

  for (const line of lines) {
    if (line.length > 50) { // Substantial line
      currentBlock += (currentBlock ? " " : "") + line;
    } else if (currentBlock) {
      if (currentBlock.length > bestBlock.length) {
        bestBlock = currentBlock;
      }
      currentBlock = "";
    }
  }

  if (currentBlock.length > bestBlock.length) {
    bestBlock = currentBlock;
  }

  // Return the best block, truncated to reasonable length
  return bestBlock.length > 50 ? bestBlock.slice(0, 3000) : null;
}

function extractArticleImage(html: string, baseUrl: string): string | null {
  // Match <img> tags with src attributes, skip tiny icons/trackers
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const skipPatterns = /favicon|icon|pixel|tracking|badge|avatar|emoji|1x1|spacer|logo/i;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || skipPatterns.test(src)) continue;
    // Skip data URIs
    if (src.startsWith("data:")) continue;
    // Skip SVGs (usually icons/logos)
    if (src.endsWith(".svg")) continue;
    // Skip very short paths (likely icons)
    if (src.length < 10) continue;

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

function resolveRelativeUrl(value: string, baseUrl: string): string | null {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
}

function normalizeJsonLdObject(value: unknown, baseUrl: string): string | null {
  if (typeof value === "string") return resolveRelativeUrl(value, baseUrl);
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = normalizeJsonLdObject(item, baseUrl);
      if (resolved) return resolved;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.url === "string") return resolveRelativeUrl(record.url, baseUrl);
    if (typeof record.thumbnailUrl === "string") return resolveRelativeUrl(record.thumbnailUrl, baseUrl);
    if (typeof record.contentUrl === "string") return resolveRelativeUrl(record.contentUrl, baseUrl);
  }
  return null;
}

function collectJsonLdObjects(value: unknown, collector: Array<Record<string, unknown>>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdObjects(item, collector);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  if (record["@type"] || record.thumbnailUrl || record.image || record.url) {
    collector.push(record);
  }

  if (record["@graph"]) collectJsonLdObjects(record["@graph"], collector);
  if (record.mainEntity) collectJsonLdObjects(record.mainEntity, collector);
  if (record.itemListElement) collectJsonLdObjects(record.itemListElement, collector);
}

function extractJsonLdImage(html: string, baseUrl: string): string | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonText = match[1].trim();
    if (!jsonText) continue;

    try {
      const parsed = JSON.parse(jsonText);
      const objects: Array<Record<string, unknown>> = [];
      collectJsonLdObjects(parsed, objects);

      for (const object of objects) {
        const type = object["@type"];
        const isVideoObject =
          typeof type === "string" ? type === "VideoObject" :
          Array.isArray(type) ? type.includes("VideoObject") : false;

        if (isVideoObject) {
          const thumbnail = normalizeJsonLdObject(object.thumbnailUrl ?? object.image ?? object.url, baseUrl);
          if (thumbnail) return thumbnail;
        }
      }

      for (const object of objects) {
        const thumbnail = normalizeJsonLdObject(object.thumbnailUrl ?? object.image ?? object.url, baseUrl);
        if (thumbnail) return thumbnail;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractMetaContent(html: string, property: string): string | null {
  // Matches both property="..." and name="..."
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  let m = regex.exec(html);
  if (m) return m[1];
  // Also try content before property/name
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  m = regex2.exec(html);
  return m ? m[1] : null;
}

async function scrapeYouTube(url: string, youtubeId: string): Promise<OGResult> {
  const thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  let title = "Untitled";
  let description = "";

  // oEmbed: most reliable source for title, no API key needed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data.title) title = data.title;
    }
  } catch {
    // fall through to page HTML
  }

  // Page HTML: extract og:description (YouTube renders this server-side)
  // and shortDescription from ytInitialData as a longer fallback
  try {
    const pageRes = await fetch(url.split("#")[0], {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const html = await pageRes.text();

    // Use og:title as fallback if oEmbed didn't work
    if (title === "Untitled") {
      const ogTitle = extractMetaContent(html, "og:title");
      if (ogTitle) title = ogTitle;
    }

    // og:description is reliably present in YouTube's server-rendered HTML
    const ogDesc = extractMetaContent(html, "og:description");
    if (ogDesc) {
      description = ogDesc;
    } else {
      // Fallback: parse shortDescription out of ytInitialData JSON blob
      const match = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
      if (match) {
        description = match[1]
          .replace(/\\n/g, " ")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
          .trim()
          .slice(0, 500);
      }
    }
  } catch {
    // page fetch failed; use whatever we have
  }

  console.log("[YouTube scrape]", { youtubeId, title, descriptionLength: description.length });

  return {
    title,
    description,
    image: thumbnail,
    articleImage: null,
    articleText: description || null,
    siteName: "YouTube",
    isYouTube: true,
    youtubeId,
    isPodcast: false,
    spotifyEpisodeId: null,
    applePodcastId: null,
    audioUrl: null,
    podcastMeta: null,
  };
}

export async function scrapeOpenGraph(url: string): Promise<OGResult> {
  const youtubeMatch = url.match(YOUTUBE_REGEX);
  const isYouTube = !!youtubeMatch;
  const youtubeId = youtubeMatch?.[1] ?? null;

  if (isYouTube && youtubeId) {
    return scrapeYouTube(url, youtubeId);
  }

  const spotifyMatch = url.match(SPOTIFY_EPISODE_REGEX);
  const spotifyEpisodeId = spotifyMatch?.[1] ?? null;

  const appleMatch = url.match(APPLE_PODCAST_REGEX);
  const applePodcastId = appleMatch ? `${appleMatch[1]}?i=${appleMatch[2]}` : null;

  const requestUrl = url.split("#")[0];
  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Upgrade-Insecure-Requests": "1",
  };

  try {
    const response = await fetch(requestUrl, {
      headers: browserHeaders,
      redirect: "follow",
    });
    const pageHtml = await response.text();
    const { default: ogs } = await import("open-graph-scraper");
    const { result } = await (ogs as any)({
      html: pageHtml,
      timeout: 10000,
    });

    const ogType = (result as Record<string, unknown>).ogType as string | undefined;
    const isPodcast = detectPodcast(requestUrl, ogType);

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
    const articleImage = extractArticleImage(pageHtml, url);

    // Extract readable text from article body
    const articleText = extractArticleText(pageHtml);

    const jsonLdImage = extractJsonLdImage(pageHtml, url);
    const ogOrTwitter = image || twitterImg || jsonLdImage;

    // Extract audio URL from og:audio or meta tags
    const ogAudio = (result as Record<string, unknown>).ogAudio as string | undefined;
    const audioUrl = ogAudio || null;

    // Podcast episode metadata
    const podcastMeta = isPodcast
      ? {
          showName: result.ogSiteName || null,
          duration: extractDuration(pageHtml),
        }
      : null;

    return {
      title: result.ogTitle || result.dcTitle || "Untitled",
      description: result.ogDescription || result.dcDescription || "",
      image: ogOrTwitter,
      articleImage: ogOrTwitter ? null : articleImage,
      articleText,
      siteName: result.ogSiteName || null,
      isYouTube: false,
      youtubeId: null,
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
      image: null,
      articleImage: null,
      articleText: null,
      siteName: null,
      isYouTube: false,
      youtubeId: null,
      isPodcast,
      spotifyEpisodeId,
      applePodcastId,
      audioUrl: null,
      podcastMeta: null,
    };
  }
}
