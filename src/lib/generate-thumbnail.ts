import { openai } from "./openai";

export async function generateThumbnail(
  title: string
): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create an abstract, modern thumbnail image for an article titled "${title}". The image should be a clean, minimalist abstract design using soft gradients and geometric shapes. No text, no words, no letters. Colors should be professional and muted — think deep purples, teals, and warm grays. Style: editorial illustration, flat design, suitable as a blog article thumbnail.`,
      n: 1,
      size: "1792x1024",
    });

    return response.data[0]?.url ?? null;
  } catch (error) {
    console.error("DALL-E thumbnail generation failed:", error);
    return null;
  }
}
