import { openai } from "./openai";
import { scrapeOpenGraph, type OGResult } from "./og-scraper";
import { uploadThumbnail } from "./thumbnail-store";
import { generateThumbnail } from "./generate-thumbnail";
import { CATEGORY_NAMES, CATEGORIES } from "./constants";

export interface EnrichmentResult {
  title: string;
  summary: string;
  categorySlugs: string[];
  contentTypes: string[];
  thumbnailUrl: string | null;
  metadata: OGResult;
}

const SYSTEM_PROMPT = `You are a content curator for an internal knowledge sharing platform at a healthcare technology company. Given a URL's metadata, produce a JSON object with:

1. "summary": Write an original 2-3 sentence summary of the content's key insights. Write for busy professionals. NEVER copy the source description verbatim. NEVER end with "..." or trailing ellipsis. Every sentence must be complete.
2. "categories": Classify into 1-3 of these categories (pick all that genuinely apply): ${CATEGORY_NAMES.join(", ")}.
3. "contentTypes": Array of content types present. Options: "ARTICLE", "VIDEO". A resource can be both (e.g., a Substack post with embedded video).

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

  const userPrompt = [
    `URL: ${url}`,
    `Title: ${og.title}`,
    `Description: ${og.description}`,
    og.siteName ? `Site: ${og.siteName}` : null,
    og.isYouTube ? "Content Type: YouTube Video" : "Content Type: Article",
  ]
    .filter(Boolean)
    .join("\n");

  const ogDesc = og.description?.replace(/\.{3,}$/, "").trim();
  let summary = ogDesc || "No summary available.";
  let categorySlugs = ["ai-trends"];
  let contentTypes = og.isYouTube ? ["VIDEO"] : ["ARTICLE"];

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
          ["ARTICLE", "VIDEO"].includes(t)
        );
        if (validTypes.length > 0) contentTypes = validTypes;
      }
    }
  } catch (error) {
    console.error("AI enrichment failed, using OG fallback:", error);
  }

  // Ensure YouTube URLs always include VIDEO
  if (og.isYouTube && !contentTypes.includes("VIDEO")) {
    contentTypes.push("VIDEO");
  }

  // Upload thumbnail to Supabase Storage for persistence
  // Fallback chain: OG/Twitter image → article body image → DALL-E generated
  let thumbnailUrl: string | null = null;
  const imageSource = og.image || og.articleImage;

  if (imageSource) {
    thumbnailUrl = await uploadThumbnail(imageSource);
    if (!thumbnailUrl) thumbnailUrl = imageSource;
  }

  if (!thumbnailUrl) {
    const generatedUrl = await generateThumbnail(og.title);
    if (generatedUrl) {
      thumbnailUrl = await uploadThumbnail(generatedUrl);
      if (!thumbnailUrl) thumbnailUrl = generatedUrl;
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
