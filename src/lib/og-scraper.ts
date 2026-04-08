import ogs from "open-graph-scraper";
import { YOUTUBE_REGEX } from "./constants";

export interface OGResult {
  title: string;
  description: string;
  image: string | null;
  siteName: string | null;
  isYouTube: boolean;
  youtubeId: string | null;
}

export async function scrapeOpenGraph(url: string): Promise<OGResult> {
  const youtubeMatch = url.match(YOUTUBE_REGEX);
  const isYouTube = !!youtubeMatch;
  const youtubeId = youtubeMatch?.[1] ?? null;

  try {
    const { result } = await ogs({ url, timeout: 10000 });

    const ogImage = result.ogImage as
      | Array<{ url?: string }>
      | { url?: string }
      | undefined;
    const image =
      (Array.isArray(ogImage)
        ? ogImage[0]?.url
        : ogImage?.url) ?? null;

    return {
      title: result.ogTitle || result.dcTitle || "Untitled",
      description: result.ogDescription || result.dcDescription || "",
      image: isYouTube && youtubeId
        ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        : image,
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
      siteName: null,
      isYouTube,
      youtubeId,
    };
  }
}
