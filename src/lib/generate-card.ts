import { CATEGORIES } from "./constants";

interface CardParams {
  title: string;
  siteName?: string | null;
  categorySlugs: string[];
  contentTypes: string[];
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function buildCardUrl(params: CardParams): string {
  const { title, siteName, categorySlugs, contentTypes } = params;
  const category =
    CATEGORIES.find((c) => c.slug === categorySlugs[0])?.name ?? "";
  const type = contentTypes[0] ?? "ARTICLE";

  const url = new URL(`${getBaseUrl()}/api/og/card`);
  url.searchParams.set("title", title);
  if (siteName) url.searchParams.set("source", siteName);
  if (category) url.searchParams.set("category", category);
  url.searchParams.set("type", type);

  return url.toString();
}
