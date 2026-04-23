import { openai } from "./openai";
import { scrapeOpenGraph, type OGResult } from "./og-scraper";
import { uploadThumbnail, uploadThumbnailBuffer } from "./thumbnail-store";
import { buildCardUrl } from "./generate-card";
import { CATEGORY_NAMES, CATEGORIES } from "./constants";

export interface EnrichmentResult {
  title: string;
  summary: string;
  categorySlugs: string[];
  contentTypes: string[];
  thumbnailUrl: string | null;
  metadata: OGResult;
}

const SYSTEM_PROMPT = `You are a content curator for an internal knowledge sharing platform at a healthcare technology company. Given a URL's metadata and article content, produce a JSON object with:

1. "summary": Write an original 2-3 sentence summary of the content's key insights based on the actual article text. Write for busy professionals. NEVER copy the source verbatim. NEVER end with "..." or trailing ellipsis. Every sentence must be complete. If article text is provided, base the summary on that — not just the metadata. For podcast episodes, include the show name and key topics discussed.
2. "categories": Classify into 1-3 of these categories (pick all that genuinely apply): ${CATEGORY_NAMES.join(", ")}.
3. "contentTypes": Array of content types present. Options: "ARTICLE", "VIDEO", "PODCAST". A resource can be both (e.g., a blog post with an embedded podcast episode).

Respond with ONLY valid JSON: {"summary": "...", "categories": ["..."], "contentTypes": ["..."]}`;

function categoriesToSlugs(names: string[]): string[] {
  const result: string[] = [];
  for (const name of names) {
    const cat = CATEGORIES.find((c) => c.name === name);
    if (cat) result.push(cat.slug);
  }
  return result;
}

export async function enrichLink(url: string): Promise<EnrichmentResult> {
  const og = await scrapeOpenGraph(url);

  const contentHint = og.isYouTube
    ? "Content Type: YouTube Video"
    : og.isPodcast
      ? "Content Type: Podcast Episode"
      : "Content Type: Article";

  const podcastMetaLines = og.podcastMeta
    ? [
        og.podcastMeta.showName ? `Podcast Show: ${og.podcastMeta.showName}` : null,
        og.podcastMeta.duration ? `Episode Duration: ${og.podcastMeta.duration}` : null,
      ]
    : [];

  const userPrompt = [
    `URL: ${url}`,
    `Title: ${og.title}`,
    og.description ? `Description: ${og.description}` : null,
    og.siteName ? `Site: ${og.siteName}` : null,
    contentHint,
    ...podcastMetaLines,
    og.articleText ? `\nArticle Content:\n${og.articleText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const ogDesc = og.description?.replace(/\.{3,}$/, "").trim();
  let summary = ogDesc || "No summary available.";
  let categorySlugs = ["ai-trends"];
  let contentTypes = og.isYouTube
    ? ["VIDEO"]
    : og.isPodcast
      ? ["PODCAST"]
      : ["ARTICLE"];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.summary) summary = parsed.summary;

      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        const validNames = parsed.categories.filter((c: string) =>
          (CATEGORY_NAMES as readonly string[]).includes(c)
        );
        if (validNames.length > 0) {
          categorySlugs = categoriesToSlugs(validNames);
        }
      }

      if (Array.isArray(parsed.contentTypes) && parsed.contentTypes.length > 0) {
        const validTypes = parsed.contentTypes.filter((t: string) =>
          ["ARTICLE", "VIDEO", "PODCAST"].includes(t)
        );
        if (validTypes.length > 0) contentTypes = validTypes;
      }
    }
  } catch (error) {
    console.error("AI enrichment failed, using OG fallback:", error);
    // Better fallback: try to generate a simple summary from available data
    if (!ogDesc) {
      if (og.articleText && og.articleText.length > 100) {
        // Simple fallback summary from article text
        const sentences = og.articleText.split(/[.!?]+/).filter(s => s.trim().length > 20);
        if (sentences.length >= 2) {
          summary = sentences.slice(0, 2).map(s => s.trim()).join('. ') + '.';
        } else if (sentences.length === 1) {
          summary = sentences[0].trim() + '.';
        }
      } else if (og.title && og.title !== "Untitled") {
        // Fallback to a generic summary based on title
        summary = `Content about ${og.title.toLowerCase()}.`;
      }
    }
  }

  // Ensure YouTube URLs always include VIDEO
  if (og.isYouTube && !contentTypes.includes("VIDEO")) {
    contentTypes.push("VIDEO");
  }

  // Ensure podcast URLs always include PODCAST
  if (og.isPodcast && !contentTypes.includes("PODCAST")) {
    contentTypes.push("PODCAST");
  }

  // Upload thumbnail to Supabase Storage for persistence
  // Fallback chain: OG image (if ≥ 15KB) → generated branded card
  const MIN_THUMBNAIL_BYTES = 15 * 1024;
  let thumbnailUrl: string | null = null;
  const imageSource = og.image || og.articleImage;

  if (imageSource) {
    const { url, byteSize } = await uploadThumbnail(imageSource);
    if (url && byteSize >= MIN_THUMBNAIL_BYTES) {
      thumbnailUrl = url;
    }
  }

  if (!thumbnailUrl) {
    const cardUrl = buildCardUrl({
      title: og.title,
      siteName: og.siteName,
      categorySlugs,
      contentTypes,
    });
    try {
      const res = await fetch(cardUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const ct = res.headers.get("content-type") ?? "image/png";
        thumbnailUrl = await uploadThumbnailBuffer(buffer, ct);
      }
    } catch (err) {
      console.error("Card generation failed:", err);
    }
  }

  return {
    title: og.title,
    summary,
    categorySlugs,
    contentTypes,
    thumbnailUrl,
    metadata: og,
  };
}
