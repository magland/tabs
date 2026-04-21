import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { IconRecord } from "../shared/types";

function iconsDir(): string {
  return path.join(app.getPath("userData"), "icons");
}

function iconPath(siteId: string): string {
  return path.join(iconsDir(), `${encodeURIComponent(siteId)}.json`);
}

function parseDataUrl(url: string): IconRecord | null {
  const m = url.match(/^data:([^;,]+)(?:;base64)?,(.*)$/);
  if (!m) return null;
  const mime = m[1];
  const isBase64 = /;base64,/i.test(url);
  const data = isBase64
    ? m[2]
    : Buffer.from(decodeURIComponent(m[2]), "utf8").toString("base64");
  return { mime, data };
}

export async function fetchAndSaveIcon(
  siteId: string,
  url: string
): Promise<IconRecord | null> {
  let record: IconRecord | null = null;
  if (url.startsWith("data:")) {
    record = parseDataUrl(url);
  } else {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) return null;
      const mime = res.headers.get("content-type")?.split(";")[0].trim() || "image/x-icon";
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength === 0) return null;
      record = { mime, data: buf.toString("base64") };
    } catch {
      return null;
    }
  }
  if (!record) return null;
  try {
    await fs.mkdir(iconsDir(), { recursive: true });
    await fs.writeFile(iconPath(siteId), JSON.stringify(record), "utf8");
  } catch {
    // Ignore disk errors — the in-memory icon still renders this session.
  }
  return record;
}

export async function loadAllIcons(): Promise<Record<string, IconRecord>> {
  let files: string[];
  try {
    files = await fs.readdir(iconsDir());
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return {};
    throw err;
  }
  const out: Record<string, IconRecord> = {};
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const siteId = decodeURIComponent(f.slice(0, -".json".length));
    try {
      const raw = await fs.readFile(path.join(iconsDir(), f), "utf8");
      const parsed = JSON.parse(raw) as IconRecord;
      if (typeof parsed?.mime === "string" && typeof parsed?.data === "string") {
        out[siteId] = parsed;
      }
    } catch {
      // skip corrupt entry
    }
  }
  return out;
}
