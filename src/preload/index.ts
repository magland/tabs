import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { IconRecord, Site, TabCommand } from "../shared/types";

const api = {
  getSites: (): Promise<Site[]> => ipcRenderer.invoke("sites:get"),
  saveSites: (sites: Site[]): Promise<void> => ipcRenderer.invoke("sites:save", sites),
  openConfig: (): Promise<string> => ipcRenderer.invoke("sites:open-config"),
  getConfigPath: (): Promise<string> => ipcRenderer.invoke("sites:config-path"),
  getIcons: (): Promise<Record<string, IconRecord>> =>
    ipcRenderer.invoke("icons:get-all"),
  saveIcon: (siteId: string, url: string): Promise<IconRecord | null> =>
    ipcRenderer.invoke("icons:save", { siteId, url }),
  onTabCommand: (handler: (cmd: TabCommand) => void): (() => void) => {
    const listener = (_: IpcRendererEvent, cmd: TabCommand) => handler(cmd);
    ipcRenderer.on("tabs:command", listener);
    return () => {
      ipcRenderer.removeListener("tabs:command", listener);
    };
  },
};

contextBridge.exposeInMainWorld("api", api);

export type Api = typeof api;
