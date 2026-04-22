import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function titleFromFilename(filename: string): string {
  return filename
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export async function POST(request: NextRequest) {
  const { filename, content } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ title: titleFromFilename(filename) });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: `Generate a concise, clear title (5-8 words) for this AI prompt.

Filename hint: ${filename}
Prompt content (first 600 chars):
${content.slice(0, 600)}

Return ONLY the title text, nothing else.`,
        },
      ],
    });

    const title =
      (message.content[0] as { type: string; text: string }).text.trim() ||
      titleFromFilename(filename);

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: titleFromFilename(filename) });
  }
}
