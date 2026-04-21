import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  session,
  type MenuItemConstructorOptions,
} from "electron";
import path from "node:path";
import { configPath, loadConfig, saveConfig } from "./config";
import { fetchAndSaveIcon, loadAllIcons } from "./icons";
import type { Site, TabCommand } from "../shared/types";

// Single-instance lock: a second launch (e.g. via a GNOME keyboard shortcut
// running the same command) hands control back to the first instance, which
// then focuses its window. This is how we bring the app to the foreground on
// Wayland, where apps cannot grab global hotkeys directly.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  focusTabsWindow();
});

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? ([{ role: "appMenu" }] as MenuItemConstructorOptions[]) : []),
    { role: "editMenu" },
    { role: "viewMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function findTabsWindow(): BrowserWindow | null {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) return w;
  }
  return null;
}

function sendTabCommand(cmd: TabCommand): void {
  const win = findTabsWindow();
  if (win) win.webContents.send("tabs:command", cmd);
}

function focusTabsWindow(): BrowserWindow | null {
  const win = findTabsWindow();
  if (!win) return null;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
  return win;
}

function handleShortcut(event: Electron.Event, input: Electron.Input): boolean {
  if (input.type !== "keyDown") return false;
  const mod = process.platform === "darwin" ? input.meta : input.control;
  if (!mod || input.shift) return false;
  if (/^[1-9]$/.test(input.key)) {
    sendTabCommand({ type: "switch", index: Number(input.key) - 1 });
    event.preventDefault();
    return true;
  }
  if (input.alt) return false;
  if (input.key === "PageDown") {
    sendTabCommand({ type: "next" });
    event.preventDefault();
    return true;
  }
  if (input.key === "PageUp") {
    sendTabCommand({ type: "prev" });
    event.preventDefault();
    return true;
  }
  return false;
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Tabs",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (devServerUrl) {
    await win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  // Pre-warm persistent session so webviews using "persist:tabs" share it.
  session.fromPartition("persist:tabs");

  buildMenu();

  // Shortcuts fire from whichever webContents currently has focus — the main
  // renderer or any webview guest — so we attach to all of them.
  app.on("web-contents-created", (_event, contents) => {
    contents.on("before-input-event", handleShortcut);
  });

  ipcMain.handle("sites:get", async () => {
    const cfg = await loadConfig();
    return cfg.sites;
  });

  ipcMain.handle("sites:save", async (_e, sites: Site[]) => {
    await saveConfig(sites);
  });

  ipcMain.handle("icons:get-all", () => loadAllIcons());

  ipcMain.handle(
    "icons:save",
    (_e, payload: { siteId: string; url: string }) =>
      fetchAndSaveIcon(payload.siteId, payload.url)
  );

  ipcMain.handle("sites:open-config", async () => {
    const file = configPath();
    // Ensure it exists before trying to open.
    await loadConfig();
    const err = await shell.openPath(file);
    if (err) throw new Error(err);
    return file;
  });

  ipcMain.handle("sites:config-path", () => configPath());

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
