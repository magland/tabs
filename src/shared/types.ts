export interface Site {
  id: string;
  name: string;
  url: string;
}

export interface SitesConfig {
  sites: Site[];
}

export type TabCommand =
  | { type: "switch"; index: number }
  | { type: "next" }
  | { type: "prev" };

export interface IconRecord {
  mime: string;
  data: string;
}
