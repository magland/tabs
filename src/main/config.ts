import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Site, SitesConfig } from "../shared/types";

const DEFAULT_SITES: Site[] = [
  { id: "github", name: "GitHub", url: "https://github.com" },
  { id: "gmail", name: "Gmail", url: "https://mail.google.com" },
  { id: "hn", name: "Hacker News", url: "https://news.ycombinator.com" },
];

export function configPath(): string {
  return path.join(app.getPath("userData"), "sites.json");
}

function coerceSites(parsed: unknown): Site[] {
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { sites?: unknown }).sites)
  ) {
    throw new Error("sites.json must be an object with a 'sites' array");
  }
  const arr = (parsed as { sites: unknown[] }).sites;
  return arr.map((entry, i) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as Site).id !== "string" ||
      typeof (entry as Site).name !== "string" ||
      typeof (entry as Site).url !== "string"
    ) {
      throw new Error(`sites.json entry ${i} must have string {id, name, url}`);
    }
    const s = entry as Site;
    return { id: s.id, name: s.name, url: s.url };
  });
}

export async function loadConfig(): Promise<SitesConfig> {
  const file = configPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    return { sites: coerceSites(JSON.parse(raw)) };
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      const seed: SitesConfig = { sites: DEFAULT_SITES };
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(seed, null, 2) + "\n", "utf8");
      console.log(`[tabs] created default config at ${file}`);
      return seed;
    }
    throw err;
  }
}

export async function saveConfig(sites: Site[]): Promise<void> {
  const validated = coerceSites({ sites });
  const file = configPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify({ sites: validated }, null, 2) + "\n", "utf8");
}
