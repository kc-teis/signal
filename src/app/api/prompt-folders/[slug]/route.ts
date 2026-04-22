import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/constants";

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
