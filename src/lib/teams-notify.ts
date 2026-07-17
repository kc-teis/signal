import { CATEGORIES } from "./constants";
import { getBaseUrl } from "./generate-card";

export interface NewSubmissionNotification {
  slug: string;
  title: string | null;
  summary: string | null;
  categorySlugs: string[];
  contentTypes: string[];
  contributorName: string;
  thumbnailUrl: string | null;
  url: string | null;
}

function categoryNames(slugs: string[]): string {
  return slugs
    .map((s) => CATEGORIES.find((c) => c.slug === s)?.name)
    .filter(Boolean)
    .join(", ");
}

function buildNewSubmissionCard(link: NewSubmissionNotification) {
  const isFolder = link.contentTypes.includes("PROMPT_FOLDER");
  const permalink = `${getBaseUrl()}${isFolder ? "/folder" : "/link"}/${link.slug}`;
  const openUrl = link.url ?? permalink;

  const body: Record<string, unknown>[] = [
    {
      type: "TextBlock",
      text: "New submission to The Signal",
      size: "Medium",
      weight: "Bolder",
    },
    {
      type: "TextBlock",
      text: `[${link.title ?? "Untitled"}](${openUrl})`,
      wrap: true,
      size: "Large",
      weight: "Bolder",
    },
  ];

  if (link.thumbnailUrl) {
    body.push({
      type: "Image",
      url: link.thumbnailUrl,
      altText: link.title ?? "Thumbnail",
      size: "Stretch",
    });
  }

  if (link.summary) {
    body.push({
      type: "TextBlock",
      text: link.summary,
      wrap: true,
    });
  }

  body.push({
    type: "TextBlock",
    text: `${categoryNames(link.categorySlugs)} · Shared by ${link.contributorName}`,
    wrap: true,
    size: "Small",
    isSubtle: true,
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
          body,
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View in Signal",
              url: permalink,
            },
          ],
        },
      },
    ],
  };
}

// Fire-and-forget: a Teams outage or misconfigured webhook must never break
// a submission, so failures are logged and swallowed rather than thrown.
export async function notifyTeamsNewSubmission(link: NewSubmissionNotification): Promise<void> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildNewSubmissionCard(link)),
    });
    if (!res.ok) {
      console.error("Teams notification failed:", res.status, await res.text());
    }
  } catch (error) {
    console.error("Teams notification error:", error);
  }
}
