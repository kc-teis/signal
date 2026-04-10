import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch all published links and aggregate in JS
    // (Supabase JS client doesn't support groupBy natively)
    const { data: links, error } = await supabase
      .from("links")
      .select("contributor_name, contributor_email, created_at")
      .eq("status", "PUBLISHED");

    if (error) {
      console.error("Contributors query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch contributors" },
        { status: 500 }
      );
    }

    // Aggregate by email
    const map = new Map<
      string,
      { name: string; email: string; linkCount: number; latestSubmission: string }
    >();

    for (const link of links ?? []) {
      const email = link.contributor_email;
      const existing = map.get(email);
      if (existing) {
        existing.linkCount++;
        if (link.created_at > existing.latestSubmission) {
          existing.latestSubmission = link.created_at;
          existing.name = link.contributor_name;
        }
      } else {
        map.set(email, {
          name: link.contributor_name,
          email,
          linkCount: 1,
          latestSubmission: link.created_at,
        });
      }
    }

    const contributors = Array.from(map.values()).sort(
      (a, b) => b.linkCount - a.linkCount
    );

    return NextResponse.json(contributors);
  } catch (error) {
    console.error("GET /api/contributors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
