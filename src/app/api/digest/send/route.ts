import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getDigestLinks, generateDigestHtml } from "@/lib/digest";
import type { LinkWithCategory } from "@/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, email, slackWebhook, teamsWebhook } = body as {
      period: "daily" | "weekly";
      email?: string;
      slackWebhook?: string;
      teamsWebhook?: string;
    };

    if (!period || !["daily", "weekly"].includes(period)) {
      return NextResponse.json(
        { error: "period must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    if (!email && !slackWebhook && !teamsWebhook) {
      return NextResponse.json(
        { error: "At least one destination (email, slackWebhook, teamsWebhook) is required" },
        { status: 400 }
      );
    }

    const links = await getDigestLinks(period);
    const results: Record<string, string> = {};

    if (email) {
      if (!resend) {
        results.email = "skipped — RESEND_API_KEY not configured";
      } else {
        const html = generateDigestHtml(links, period);
        const periodLabel = period === "daily" ? "Daily" : "Weekly";
        await resend.emails.send({
          from: "The Signal <digest@knowledge-hub.internal>",
          to: email,
          subject: `The Signal ${periodLabel} Digest — ${links.length} new links`,
          html,
        });
        results.email = `sent to ${email}`;
      }
    }

    if (slackWebhook) {
      const slackPayload = buildSlackPayload(links, period);
      const res = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      });
      results.slack = res.ok
        ? "sent"
        : `failed (${res.status}: ${await res.text()})`;
    }

    if (teamsWebhook) {
      const teamsPayload = buildTeamsCard(links, period);
      const res = await fetch(teamsWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamsPayload),
      });
      results.teams = res.ok
        ? "sent"
        : `failed (${res.status}: ${await res.text()})`;
    }

    return NextResponse.json({
      period,
      linkCount: links.length,
      results,
    });
  } catch (error) {
    console.error("Digest send error:", error);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}

function buildSlackPayload(links: LinkWithCategory[], period: "daily" | "weekly") {
  const top = links.slice(0, 5);
  const periodLabel = period === "daily" ? "Daily" : "Weekly";

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `The Signal ${periodLabel} Digest`,
        emoji: true,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${links.length} new link${links.length === 1 ? "" : "s"} shared ${period === "daily" ? "today" : "this week"}`,
        },
      ],
    },
    { type: "divider" },
  ];

  for (const link of top) {
    const summary =
      link.summary && link.summary.length > 100
        ? link.summary.slice(0, 100) + "..."
        : (link.summary ?? "");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<${link.url}|${link.title ?? link.url}>*\n${summary}\n_${link.categories.map(c => c.name).join(", ")} · Shared by ${link.contributorName}_`,
      },
      ...(link.thumbnailUrl
        ? {
            accessory: {
              type: "image",
              image_url: link.thumbnailUrl,
              alt_text: link.title ?? "Link thumbnail",
            },
          }
        : {}),
    });
  }

  if (links.length > 5) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_+ ${links.length - 5} more link${links.length - 5 === 1 ? "" : "s"} in the full digest_`,
        },
      ],
    });
  }

  return { blocks };
}

function buildTeamsCard(links: LinkWithCategory[], period: "daily" | "weekly") {
  const top = links.slice(0, 5);
  const periodLabel = period === "daily" ? "Daily" : "Weekly";

  const items = top.map((link) => {
    const summary =
      link.summary && link.summary.length > 100
        ? link.summary.slice(0, 100) + "..."
        : (link.summary ?? "");

    return {
      type: "Container",
      items: [
        {
          type: "TextBlock",
          text: `[${link.title ?? link.url}](${link.url})`,
          wrap: true,
          weight: "Bolder",
        },
        ...(summary
          ? [
              {
                type: "TextBlock",
                text: summary,
                wrap: true,
                size: "Small",
                color: "Default",
              },
            ]
          : []),
        {
          type: "TextBlock",
          text: `${link.categories.map(c => c.name).join(", ")} · Shared by ${link.contributorName}`,
          wrap: true,
          size: "Small",
          isSubtle: true,
        },
      ],
      separator: true,
    };
  });

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `The Signal ${periodLabel} Digest`,
              size: "Large",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: `${links.length} new link${links.length === 1 ? "" : "s"} shared ${period === "daily" ? "today" : "this week"}`,
              size: "Small",
              isSubtle: true,
            },
            ...items,
            ...(links.length > 5
              ? [
                  {
                    type: "TextBlock",
                    text: `+ ${links.length - 5} more in the full digest`,
                    size: "Small",
                    isSubtle: true,
                  },
                ]
              : []),
          ],
        },
      },
    ],
  };
}
