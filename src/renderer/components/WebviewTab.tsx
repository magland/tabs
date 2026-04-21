import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Site } from "../../shared/types";
import type { WebviewElement } from "../webview";

export interface NavState {
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  url: string;
  title: string;
}

export interface WebviewTabHandle {
  back(): void;
  forward(): void;
  reload(): void;
  stop(): void;
  resetToHome(): void;
  navigate(url: string): void;
  focus(): void;
}

interface Props {
  site: Site;
  active: boolean;
  onNavState: (id: string, state: NavState) => void;
  onFavicon: (id: string, url: string) => void;
}

export const WebviewTab = forwardRef<WebviewTabHandle, Props>(function WebviewTab(
  { site, active, onNavState, onFavicon },
  ref
) {
  const wvRef = useRef<WebviewElement | null>(null);

  useImperativeHandle(ref, () => ({
    back: () => {
      const wv = wvRef.current;
      if (wv && wv.canGoBack()) wv.goBack();
    },
    forward: () => {
      const wv = wvRef.current;
      if (wv && wv.canGoForward()) wv.goForward();
    },
    reload: () => wvRef.current?.reload(),
    stop: () => wvRef.current?.stop(),
    resetToHome: () => {
      void wvRef.current?.loadURL(site.url);
    },
    navigate: (url: string) => {
      void wvRef.current?.loadURL(url);
    },
    focus: () => wvRef.current?.focus(),
  }));

  useEffect(() => {
    const wv = wvRef.current;
    if (!wv) return;

    const emit = () => {
      onNavState(site.id, {
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
        loading: wv.isLoading(),
        url: wv.getURL(),
        title: wv.getTitle(),
      });
    };

    const events = [
      "did-start-loading",
      "did-stop-loading",
      "did-navigate",
      "did-navigate-in-page",
      "page-title-updated",
      "dom-ready",
    ] as const;

    events.forEach((ev) => wv.addEventListener(ev, emit));

    // target="_blank" links: keep them inside this tab rather than spawning windows.
    const onNewWindow = (e: Event) => {
      const ev = e as Event & { url?: string; preventDefault?: () => void };
      ev.preventDefault?.();
      if (ev.url) void wv.loadURL(ev.url);
    };
    wv.addEventListener("new-window", onNewWindow as EventListener);

    const onFaviconEvent = (e: Event) => {
      const ev = e as Event & { favicons?: string[] };
      const first = ev.favicons?.[0];
      if (first) onFavicon(site.id, first);
    };
    wv.addEventListener("page-favicon-updated", onFaviconEvent as EventListener);

    return () => {
      events.forEach((ev) => wv.removeEventListener(ev, emit));
      wv.removeEventListener("new-window", onNewWindow as EventListener);
      wv.removeEventListener("page-favicon-updated", onFaviconEvent as EventListener);
    };
  }, [site.id, onNavState, onFavicon]);

  return (
    <webview
      ref={(el) => {
        wvRef.current = el as unknown as WebviewElement | null;
      }}
      src={site.url}
      partition="persist:tabs"
      allowpopups={true}
      className={`webview ${active ? "active" : ""}`}
    />
  );
});
