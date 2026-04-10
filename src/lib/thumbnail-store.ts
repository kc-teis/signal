import { supabase } from "./supabase";
import { nanoid } from "nanoid";

export async function uploadThumbnail(
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    const filename = `${nanoid()}.${ext}`;

    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(filename, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("Thumbnail upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Thumbnail fetch/upload failed:", error);
    return null;
  }
}
