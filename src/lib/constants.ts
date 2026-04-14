export const CATEGORIES = [
  { name: "Product Management", slug: "pm" },
  { name: "User Experience Design", slug: "ux" },
  { name: "Engineering", slug: "dev" },
  { name: "Executives", slug: "executives" },
  { name: "Process", slug: "process" },
  { name: "AI Trends", slug: "ai-trends" },
  { name: "SDLC", slug: "sdlc" },
] as const;

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const CONTENT_TYPES = ["ARTICLE", "VIDEO", "PODCAST", "PROMPT"] as const;

export const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const SPOTIFY_EPISODE_REGEX =
  /open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/;

export const APPLE_PODCAST_REGEX =
  /podcasts\.apple\.com\/[a-z]{2}\/podcast\/[^/]+\/id(\d+)\?i=(\d+)/;

export const PODCAST_URL_PATTERNS = [
  /open\.spotify\.com\/(episode|show)\//,
  /podcasts\.apple\.com\//,
  /overcast\.fm\//,
  /pocketcasts\.com\//,
  /podcasts\.google\.com\//,
  /castro\.fm\//,
  /pod\.link\//,
];

export const DEFAULT_PAGE_SIZE = 12;
