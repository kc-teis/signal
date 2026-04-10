import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { submitPromptSchema } from "@/lib/validators";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const attachLinkId = request.nextUrl.searchParams.get("attach");

    // Attach prompts to an existing link
    if (attachLinkId) {
      const body = await request.json();
      const promptsArr = body.prompts as { title: string; body: string }[];
      if (!Array.isArray(promptsArr) || promptsArr.length === 0) {
        return NextResponse.json({ error: "No prompts provided" }, { status: 400 });
      }

      // Get link info for contributor details
      const { data: link } = await supabase
        .from("links")
        .select("contributor_name, contributor_email, category_slugs")
        .eq("id", attachLinkId)
        .single();

      const rows = promptsArr.map((p, i) => ({
        link_id: attachLinkId,
        title: p.title,
        body: p.body,
        contributor_name: link?.contributor_name ?? "Unknown",
        contributor_email: link?.contributor_email ?? "",
        category_slugs: link?.category_slugs ?? [],
        sort_order: i,
      }));

      const { error } = await supabase.from("prompts").insert(rows);
      if (error) {
        console.error("Attach prompts error:", error);
        return NextResponse.json({ error: "Failed to attach prompts" }, { status: 500 });
      }

      return NextResponse.json({ success: true, count: rows.length }, { status: 201 });
    }

    // Standalone prompt submission
    const body = await request.json();
    const parsed = submitPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, body: promptBody, categorySlugs, contributorName, contributorEmail, contextNote } = parsed.data;

    const summary = promptBody.length > 200
      ? promptBody.slice(0, 200).trimEnd() + "..."
      : promptBody;

    const slug = generateSlug(title);

    // Create the link record (url: null, direct publish)
    const { data: link, error: linkError } = await supabase
      .from("links")
      .insert({
        url: null,
        slug,
        title,
        summary,
        thumbnail_url: null,
        content_types: ["PROMPT"],
        category_slugs: categorySlugs,
        contributor_name: contributorName,
        contributor_email: contributorEmail,
        context_note: contextNote ?? null,
        metadata: null,
        status: "PUBLISHED",
      })
      .select()
      .single();

    if (linkError) {
      console.error("Prompt link insert error:", linkError);
      return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
    }

    // Create the prompt record
    const { error: promptError } = await supabase
      .from("prompts")
      .insert({
        link_id: link.id,
        title,
        body: promptBody,
        contributor_name: contributorName,
        contributor_email: contributorEmail,
        category_slugs: categorySlugs,
        sort_order: 0,
      });

    if (promptError) {
      console.error("Prompt insert error:", promptError);
    }

    return NextResponse.json({
      id: link.id,
      slug: link.slug,
      title: link.title,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const linkId = request.nextUrl.searchParams.get("link_id");

    let query = supabase
      .from("prompts")
      .select("*")
      .order("sort_order", { ascending: true });

    if (linkId) {
      query = query.eq("link_id", linkId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Prompts query error:", error);
      return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
    }

    const prompts = (data ?? []).map((p) => ({
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

    return NextResponse.json(prompts);
  } catch (error) {
    console.error("GET /api/prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
