import { supabase } from "@/lib/supabase";
import type { Category, LinkWithCategory } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getDigestLinks(
  period: "daily" | "weekly"
): Promise<LinkWithCategory[]> {
  const since = new Date();
  since.setDate(since.getDate() - (period === "daily" ? 1 : 7));

  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("status", "PUBLISHED")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Collect all unique category slugs, then resolve in one query
  const allSlugs = Array.from(
    new Set(data.flatMap((l: any) => l.category_slugs ?? []))
  );

  let categoryMap = new Map<string, Category>();
  if (allSlugs.length > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, slug")
      .in("slug", allSlugs);
    if (cats) {
      categoryMap = new Map(cats.map((c: any) => [c.slug, c as Category]));
    }
  }

  return data.map((link: any) => {
    const categories = (link.category_slugs ?? [])
      .map((s: string) => categoryMap.get(s))
      .filter(Boolean) as Category[];

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
  });
}

export function generateDigestHtml(
  links: LinkWithCategory[],
  period: "daily" | "weekly"
): string {
  const periodLabel = period === "daily" ? "Daily Digest" : "Weekly Digest";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const linkCards = links
    .map((link) => {
      const summary =
        link.summary && link.summary.length > 100
          ? link.summary.slice(0, 100) + "..."
          : (link.summary ?? "");

      const thumbnail = link.thumbnailUrl
        ? `<img src="${link.thumbnailUrl}" alt="" width="80" height="80" style="width:80px;height:80px;object-fit:cover;border-radius:6px;display:block;" />`
        : `<div style="width:80px;height:80px;border-radius:6px;background-color:#e8edf2;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:28px;color:#8899aa;">&#128279;</span>
           </div>`;

      const contentBadges = (link.contentTypes ?? [])
        .filter((t) => t === "VIDEO")
        .map(
          () =>
            `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:#eff6ff;color:#2563eb;font-size:11px;font-weight:600;letter-spacing:0.3px;margin-left:6px;">VIDEO</span>`
        )
        .join("");

      const categoryBadges = (link.categories ?? [])
        .map(
          (cat) =>
            `<span style="display:inline-block;padding:2px 10px;border-radius:12px;background-color:#f0f4f8;color:#475569;font-size:12px;font-weight:500;margin-right:4px;">
              ${escapeHtml(cat.name)}
            </span>`
        )
        .join("");

      return `
      <tr>
        <td style="padding:0 0 16px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="width:80px;vertical-align:top;padding-right:16px;">
                      <a href="${link.url}" target="_blank" style="text-decoration:none;">
                        ${thumbnail}
                      </a>
                    </td>
                    <td style="vertical-align:top;">
                      <a href="${link.url}" target="_blank" style="text-decoration:none;color:#111827;font-size:16px;font-weight:600;line-height:1.4;">
                        ${escapeHtml(link.title ?? link.url)}
                      </a>
                      ${contentBadges}
                      <div style="margin-top:6px;">
                        ${categoryBadges}
                      </div>
                      ${summary ? `<p style="margin:8px 0 0 0;color:#4b5563;font-size:14px;line-height:1.5;">${escapeHtml(summary)}</p>` : ""}
                      <p style="margin:8px 0 0 0;color:#9ca3af;font-size:12px;">
                        Shared by <span style="color:#6b7280;font-weight:500;">${escapeHtml(link.contributorName)}</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>The Signal ${periodLabel}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">The Signal</h1>
              <p style="margin:0 0 12px 0;font-size:14px;color:#94a3b8;">${periodLabel} &middot; ${escapeHtml(dateStr)}</p>
              <div style="width:40px;height:3px;background-color:#3b82f6;margin:0 auto;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:24px 32px 8px 32px;background-color:#ffffff;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
                ${links.length === 0 ? "No new links were published this period. Check back soon." : `${links.length} new ${links.length === 1 ? "link" : "links"} shared by your colleagues${period === "daily" ? " today" : " this week"}.`}
              </p>
            </td>
          </tr>

          <!-- Links -->
          ${links.length > 0 ? `
          <tr>
            <td style="padding:16px 32px 24px 32px;background-color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${linkCards}
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                You're receiving this because you subscribed to The Signal digests.
              </p>
              <a href="{{unsubscribe_url}}" style="font-size:13px;color:#6b7280;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
