import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishLinkSchema } from "@/lib/validators";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const { data: link, error } = await supabase
      .from("links")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const categories = await resolveCategories(link.category_slugs);

    // Fetch attached prompts
    const { data: promptsData } = await supabase
      .from("prompts")
      .select("*")
      .eq("link_id", link.id)
      .order("sort_order", { ascending: true });

    const prompts = (promptsData ?? []).map((p: any) => ({
      id: p.id,
      linkId: p.link_id,
      title: p.title,
      body: p.body,
      contributorName: p.contributor_name,
      contributorEmail: p.contributor_email,
      categorySlugs: p.category_slugs,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
    }));

    return NextResponse.json({
      ...mapLink(link, categories),
      prompts,
      promptCount: prompts.length,
    });
  } catch (error) {
    console.error("GET /api/links/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const parsed = publishLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      summary,
      categorySlugs,
      contentTypes,
      thumbnailUrl,
      contextNote,
      regenerateEnrichment,
    } = parsed.data;

    let updateData: any = {
      title,
      summary,
      category_slugs: categorySlugs,
      content_types: contentTypes,
      thumbnail_url: thumbnailUrl ?? null,
      context_note: contextNote ?? null,
      status: "PUBLISHED",
    };

    // If regenerateEnrichment is true, re-run enrichment on the original URL
    if (regenerateEnrichment) {
      const { data: existingLink } = await supabase
        .from("links")
        .select("url")
        .eq("slug", slug)
        .single();

      if (existingLink?.url) {
        const { enrichLink } = await import("@/lib/enrichment");
        const enrichment = await enrichLink(existingLink.url);
        updateData = {
          ...updateData,
          title: enrichment.title,
          summary: enrichment.summary,
          thumbnail_url: enrichment.thumbnailUrl,
          content_types: enrichment.contentTypes,
          category_slugs: enrichment.categorySlugs,
          metadata: enrichment.metadata,
        };
      }
    }

    const { data: link, error: updateError } = await supabase
      .from("links")
      .update(updateData)
      .eq("slug", slug)
      .select()
      .single();

    if (updateError || !link) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update link" },
        { status: 500 }
      );
    }

    const categories = await resolveCategories(link.category_slugs);

    return NextResponse.json(mapLink(link, categories));
  } catch (error) {
    console.error("PATCH /api/links/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const { error } = await supabase.from("links").delete().eq("slug", slug);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/links/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
