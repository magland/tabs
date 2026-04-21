import { useCallback, useEffect, useRef, useState } from "react";
import type { IconRecord, Site } from "../shared/types";
import { Sidebar } from "./components/Sidebar";
import { SitesManager } from "./components/SitesManager";
import { Toolbar } from "./components/Toolbar";
import { WebviewTab, type NavState, type WebviewTabHandle } from "./components/WebviewTab";

export function App() {
  const [sites, setSites] = useState<Site[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [navStates, setNavStates] = useState<Record<string, NavState>>({});
  const [icons, setIcons] = useState<Record<string, IconRecord>>({});
  const [configPath, setConfigPath] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);
  const refs = useRef<Record<string, WebviewTabHandle | null>>({});
  const lastFaviconUrl = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loaded, p, cachedIcons] = await Promise.all([
        window.api.getSites(),
        window.api.getConfigPath(),
        window.api.getIcons(),
      ]);
      if (cancelled) return;
      setSites(loaded);
      setConfigPath(p);
      setIcons(cachedIcons);
      if (loaded.length > 0) setActiveId(loaded[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavState = useCallback((id: string, state: NavState) => {
    setNavStates((prev) => ({ ...prev, [id]: state }));
  }, []);

  const handleFavicon = useCallback(async (id: string, url: string) => {
    if (lastFaviconUrl.current[id] === url) return;
    lastFaviconUrl.current[id] = url;
    const record = await window.api.saveIcon(id, url);
    if (record) setIcons((prev) => ({ ...prev, [id]: record }));
  }, []);

  // Focus the newly-active webview so keyboard input (and subsequent shortcuts)
  // land on a real element instead of one we just hid.
  useEffect(() => {
    if (!activeId) return;
    const handle = refs.current[activeId];
    // Defer one frame: visibility change + focus() in the same tick can race.
    const raf = requestAnimationFrame(() => handle?.focus());
    return () => cancelAnimationFrame(raf);
  }, [activeId]);

  useEffect(() => {
    if (!sites || sites.length === 0) return;
    return window.api.onTabCommand((cmd) => {
      if (cmd.type === "switch") {
        // Chrome convention: Ctrl+9 jumps to the last tab regardless of count.
        const idx = cmd.index === 8 ? sites.length - 1 : cmd.index;
        const target = sites[idx];
        if (target) setActiveId(target.id);
        return;
      }
      setActiveId((prev) => {
        const currentIdx = sites.findIndex((s) => s.id === prev);
        if (currentIdx < 0) return sites[0].id;
        const delta = cmd.type === "next" ? 1 : -1;
        const nextIdx = (currentIdx + delta + sites.length) % sites.length;
        return sites[nextIdx].id;
      });
    });
  }, [sites]);

  const activeSite = sites?.find((s) => s.id === activeId);
  const activeNav = activeId ? navStates[activeId] : undefined;
  const activeRef = () => (activeId ? refs.current[activeId] : null);

  const handleSave = useCallback(
    async (next: Site[]) => {
      await window.api.saveSites(next);
      // Drop nav state for removed sites so we don't keep stale entries.
      setNavStates((prev) => {
        const kept: Record<string, NavState> = {};
        for (const s of next) if (prev[s.id]) kept[s.id] = prev[s.id];
        return kept;
      });
      setSites(next);
      setActiveId((prev) => {
        if (prev && next.some((s) => s.id === prev)) return prev;
        return next[0]?.id ?? null;
      });
    },
    []
  );

  return (
    <div className="app">
      <Sidebar
        sites={sites ?? []}
        activeId={activeId}
        icons={icons}
        onSelect={setActiveId}
        onManage={() => setManagerOpen(true)}
        onReorder={handleSave}
        configPath={configPath}
      />
      <div className="main">
        <Toolbar
          nav={activeNav}
          site={activeSite}
          onBack={() => activeRef()?.back()}
          onForward={() => activeRef()?.forward()}
          onReload={() => activeRef()?.reload()}
          onStop={() => activeRef()?.stop()}
          onHome={() => activeRef()?.resetToHome()}
          onNavigate={(url) => activeRef()?.navigate(url)}
        />
        <div className="tabs-container">
          {sites?.map((site) => (
            <WebviewTab
              key={site.id}
              ref={(el) => {
                refs.current[site.id] = el;
              }}
              site={site}
              active={site.id === activeId}
              onNavState={handleNavState}
              onFavicon={handleFavicon}
            />
          ))}
          {sites && sites.length === 0 ? (
            <div className="empty-state">
              No sites configured. Click <b>Manage sites…</b> to add some.
            </div>
          ) : null}
        </div>
      </div>
      {managerOpen && sites ? (
        <SitesManager
          initialSites={sites}
          onClose={() => setManagerOpen(false)}
          onSave={handleSave}
          onOpenJson={() => {
            void window.api.openConfig();
          }}
        />
      ) : null}
    </div>
  );
}
