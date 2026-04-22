import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/constants";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data: folder, error } = await supabase
    .from("prompt_folders")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: prompts } = await supabase
    .from("folder_prompts")
    .select("*")
    .eq("folder_id", folder.id)
    .order("sort_order", { ascending: true });

  const categories = CATEGORIES.filter((c) =>
    (folder.category_slugs as string[]).includes(c.slug)
  );

  return NextResponse.json({
    id: folder.id,
    slug: folder.slug,
    title: folder.title,
    description: folder.description,
    categorySlugs: folder.category_slugs,
    contributorName: folder.contributor_name,
    contributorEmail: folder.contributor_email,
    createdAt: folder.created_at,
    updatedAt: folder.updated_at,
    categories,
    prompts: (prompts ?? []).map((p) => ({
      id: p.id,
      folderId: p.folder_id,
      title: p.title,
      body: p.body,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { title, description, categorySlugs, prompts } = await request.json() as {
      title: string;
      description?: string;
      categorySlugs: string[];
      prompts: { id: string | null; title: string; body: string }[];
    };

    if (!title?.trim() || !categorySlugs?.length || !prompts?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: folder, error: fetchError } = await supabase
      .from("prompt_folders")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (fetchError || !folder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update the folder wrapper
    const { error: folderError } = await supabase
      .from("prompt_folders")
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        category_slugs: categorySlugs,
      })
      .eq("id", folder.id);

    if (folderError) throw folderError;

    // Reconcile prompts: fetch existing IDs, then upsert/delete
    const { data: existingPrompts } = await supabase
      .from("folder_prompts")
      .select("id")
      .eq("folder_id", folder.id);

    const existingIds = (existingPrompts ?? []).map((p) => p.id as string);
    const incomingIdSet = new Set(prompts.filter((p) => p.id).map((p) => p.id as string));

    // Delete prompts that were removed
    const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));
    if (toDelete.length > 0) {
      await supabase.from("folder_prompts").delete().in("id", toDelete);
    }

    const existingIdSet = new Set(existingIds);
    // Update existing prompts
    const toUpdate = prompts.filter((p) => p.id && existingIdSet.has(p.id));
    for (const p of toUpdate) {
      await supabase
        .from("folder_prompts")
        .update({ title: p.title.trim(), body: p.body.trim(), sort_order: prompts.indexOf(p) })
        .eq("id", p.id as string);
    }

    // Insert new prompts
    const toInsert = prompts.filter((p) => !p.id);
    if (toInsert.length > 0) {
      await supabase.from("folder_prompts").insert(
        toInsert.map((p) => ({
          id: nanoid(),
          folder_id: folder.id,
          title: p.title.trim(),
          body: p.body.trim(),
          sort_order: prompts.indexOf(p),
        }))
      );
    }

    // Keep the links record in sync
    const summary = description?.trim() ||
      `A collection of ${prompts.length} prompt${prompts.length === 1 ? "" : "s"}.`;

    await supabase
      .from("links")
      .update({ title: title.trim(), summary, category_slugs: categorySlugs })
      .eq("slug", params.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/prompt-folders/[slug] error:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}
