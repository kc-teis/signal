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

export const CONTENT_TYPES = ["ARTICLE", "VIDEO"] as const;

export const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const DEFAULT_PAGE_SIZE = 12;
