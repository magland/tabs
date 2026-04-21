import type { Site, TabCommand } from "../shared/types";

export interface Api {
  getSites: () => Promise<Site[]>;
  saveSites: (sites: Site[]) => Promise<void>;
  openConfig: () => Promise<string>;
  getConfigPath: () => Promise<string>;
  onTabCommand: (handler: (cmd: TabCommand) => void) => () => void;
}

declare global {
  interface Window {
    api: Api;
  }
}
