import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf8");

const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function supabaseUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

async function uploadThumbnail(imageUrl) {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
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

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/thumbnails/${filename}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": contentType,
          "Cache-Control": "max-age=31536000",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("  Upload error:", err);
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/thumbnails/${filename}`;
  } catch (err) {
    console.error("  Fetch/upload failed:", err.message);
    return null;
  }
}

async function main() {
  console.log(`Using Supabase: ${SUPABASE_URL}\n`);

  const links = await supabaseGet(
    "links?select=id,title,thumbnail_url&thumbnail_url=not.is.null"
  );

  const toMigrate = links.filter(
    (l) => l.thumbnail_url && !l.thumbnail_url.includes(SUPABASE_URL)
  );

  console.log(`Found ${toMigrate.length} links with external thumbnails\n`);

  let migrated = 0;
  let failed = 0;

  for (const link of toMigrate) {
    console.log(`[${migrated + failed + 1}/${toMigrate.length}] ${link.title}`);
    console.log(`  Original: ${link.thumbnail_url}`);

    const newUrl = await uploadThumbnail(link.thumbnail_url);
    if (newUrl) {
      const ok = await supabaseUpdate("links", link.id, { thumbnail_url: newUrl });
      if (ok) {
        console.log(`  Migrated: ${newUrl}`);
        migrated++;
      } else {
        console.error("  DB update failed");
        failed++;
      }
    } else {
      console.log("  Skipped (download failed)");
      failed++;
    }
    console.log();
  }

  console.log(`Done. Migrated: ${migrated}, Failed: ${failed}`);
}

main();
