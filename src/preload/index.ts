import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { Site, TabCommand } from "../shared/types";

const api = {
  getSites: (): Promise<Site[]> => ipcRenderer.invoke("sites:get"),
  saveSites: (sites: Site[]): Promise<void> => ipcRenderer.invoke("sites:save", sites),
  openConfig: (): Promise<string> => ipcRenderer.invoke("sites:open-config"),
  getConfigPath: (): Promise<string> => ipcRenderer.invoke("sites:config-path"),
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
