import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { enrichLink } from "@/lib/enrichment";
import { submitLinkSchema, feedQuerySchema } from "@/lib/validators";
import { generateSlug } from "@/lib/slug";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function resolveCategories(slugs: string[]): Promise<Category[]> {
  if (!slugs || slugs.length === 0) return [];
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .in("slug", slugs);
  return (data as Category[]) ?? [];
}

function mapLink(link: any, categories: Category[]) {
  return {
    id: link.id,
    url: link.url,
    slug: link.slug,
    title: link.title,
    summary: link.summary,
    thumbnailUrl: link.thumbnail_url,
    categorySlugs: link.category_slugs,
    contentTypes: link.content_types,
    contributorName: link.contributor_name,
    contributorEmail: link.contributor_email,
    contextNote: link.context_note,
    metadata: link.metadata,
    status: link.status,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
    categories,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = submitLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, contributorName, contributorEmail, contextNote } = parsed.data;

    const enrichment = await enrichLink(url);

    const slug = generateSlug(enrichment.title);

    const { data: link, error: insertError } = await supabase
      .from("links")
      .insert({
        url,
        slug,
        title: enrichment.title,
        summary: enrichment.summary,
        thumbnail_url: enrichment.thumbnailUrl,
        content_types: enrichment.contentTypes,
        category_slugs: enrichment.categorySlugs,
        contributor_name: contributorName,
        contributor_email: contributorEmail,
        context_note: contextNote ?? null,
        metadata: enrichment.metadata,
        status: "DRAFT",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create link" },
        { status: 500 }
      );
    }

    const categories = await resolveCategories(link.category_slugs);

    return NextResponse.json(mapLink(link, categories), { status: 201 });
  } catch (error) {
    console.error("POST /api/links error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = feedQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { categories: categoriesParam, contributor, contentTypes: contentTypesParam, sort, page, limit } =
      parsed.data;

    let query = supabase
      .from("links")
      .select("*", { count: "exact" })
      .eq("status", "PUBLISHED");

    if (categoriesParam) {
      const slugs = categoriesParam.split(",").map((s) => s.trim());
      query = query.overlaps("category_slugs", slugs);
    }

    if (contributor) {
      query = query.eq("contributor_email", contributor);
    }

    if (contentTypesParam) {
      const types = contentTypesParam.split(",").map((s) => s.trim());
      query = query.overlaps("content_types", types);
    }

    query = query.order("created_at", {
      ascending: sort === "oldest",
    });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: links, count, error } = await query;

    if (error) {
      console.error("Feed query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch links" },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    // Collect all unique category slugs across returned links
    const allSlugs = Array.from(
      new Set((links ?? []).flatMap((l: any) => l.category_slugs ?? []))
    );
    const allCategories = await resolveCategories(allSlugs);
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c]));

    const mappedLinks = (links ?? []).map((link: any) => {
      const linkCategories = (link.category_slugs ?? [])
        .map((s: string) => categoryMap.get(s))
        .filter(Boolean) as Category[];
      return mapLink(link, linkCategories);
    });

    return NextResponse.json({
      links: mappedLinks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/links error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
