import { NextRequest, NextResponse } from "next/server";
import { supabaseNoCache as supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

const DEVICE_ID_COOKIE = "kh_device_id";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const deviceId = request.cookies.get(DEVICE_ID_COOKIE)?.value;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing device identity" },
        { status: 400 }
      );
    }

    const { data: link, error: linkError } = await supabase
      .from("links")
      .select("id, upvote_count")
      .eq("slug", slug)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("upvotes")
      .select("id")
      .eq("link_id", link.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    const delta = existing ? -1 : 1;

    if (existing) {
      await supabase.from("upvotes").delete().eq("id", existing.id);
    } else {
      const { error: insertError } = await supabase
        .from("upvotes")
        .insert({ link_id: link.id, device_id: deviceId });
      if (insertError) {
        console.error("Upvote insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to record upvote" },
          { status: 500 }
        );
      }
    }

    const newCount = Math.max(0, (link.upvote_count ?? 0) + delta);

    const { error: updateError } = await supabase
      .from("links")
      .update({ upvote_count: newCount })
      .eq("id", link.id);

    if (updateError) {
      console.error("Upvote count update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update upvote count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ upvoted: !existing, upvoteCount: newCount });
  } catch (error) {
    console.error("POST /api/links/[slug]/upvote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
