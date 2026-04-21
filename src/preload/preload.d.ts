import type { IconRecord, Site, TabCommand } from "../shared/types";

export interface Api {
  getSites: () => Promise<Site[]>;
  saveSites: (sites: Site[]) => Promise<void>;
  openConfig: () => Promise<string>;
  getConfigPath: () => Promise<string>;
  getIcons: () => Promise<Record<string, IconRecord>>;
  saveIcon: (siteId: string, url: string) => Promise<IconRecord | null>;
  onTabCommand: (handler: (cmd: TabCommand) => void) => () => void;
}

declare global {
  interface Window {
    api: Api;
  }
}
