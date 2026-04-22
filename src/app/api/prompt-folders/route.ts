import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, categorySlugs, contributorName, contributorEmail, prompts } = body as {
      title: string;
      description?: string;
      categorySlugs: string[];
      contributorName: string;
      contributorEmail: string;
      prompts: { title: string; body: string }[];
    };

    if (!title?.trim() || !categorySlugs?.length || !contributorName?.trim() || !contributorEmail?.trim() || !prompts?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = `${slugify(title)}-${nanoid(6)}`;
    const folderId = nanoid();

    const { error: folderError } = await supabase.from("prompt_folders").insert({
      id: folderId,
      slug,
      title: title.trim(),
      description: description?.trim() || null,
      category_slugs: categorySlugs,
      contributor_name: contributorName.trim(),
      contributor_email: contributorEmail.trim(),
    });

    if (folderError) throw folderError;

    const { error: promptsError } = await supabase.from("folder_prompts").insert(
      prompts.map((p, i) => ({
        id: nanoid(),
        folder_id: folderId,
        title: p.title.trim(),
        body: p.body.trim(),
        sort_order: i,
      }))
    );

    if (promptsError) throw promptsError;

    // Create a links record so the folder surfaces in the feed
    const summary =
      description?.trim() ||
      `A collection of ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}.`;

    const { error: linkError } = await supabase.from("links").insert({
      id: nanoid(),
      slug,
      url: null,
      title: title.trim(),
      summary,
      thumbnail_url: null,
      category_slugs: categorySlugs,
      content_types: ["PROMPT_FOLDER"],
      contributor_name: contributorName.trim(),
      contributor_email: contributorEmail.trim(),
      context_note: null,
      status: "PUBLISHED",
    });

    if (linkError) throw linkError;

    return NextResponse.json({ slug, promptCount: prompts.length });
  } catch (error) {
    console.error("Prompt folder submit error:", error);
    return NextResponse.json({ error: "Failed to create prompt folder" }, { status: 500 });
  }
}
