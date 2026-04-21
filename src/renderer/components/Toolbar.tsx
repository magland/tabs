import { useEffect, useState } from "react";
import type { Site } from "../../shared/types";
import type { NavState } from "./WebviewTab";

interface Props {
  nav?: NavState;
  site?: Site;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
}

export function Toolbar({
  nav,
  site,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onNavigate,
}: Props) {
  const [addr, setAddr] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setAddr(nav?.url ?? site?.url ?? "");
  }, [nav?.url, site?.url, editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = addr.trim();
    if (!url) return;
    if (!/^[a-z]+:\/\//i.test(url)) url = "https://" + url;
    onNavigate(url);
    (document.activeElement as HTMLElement | null)?.blur();
    setEditing(false);
  };

  return (
    <div className="toolbar">
      <button className="tb-btn" onClick={onBack} disabled={!nav?.canGoBack} title="Back">
        ←
      </button>
      <button
        className="tb-btn"
        onClick={onForward}
        disabled={!nav?.canGoForward}
        title="Forward"
      >
        →
      </button>
      {nav?.loading ? (
        <button className="tb-btn" onClick={onStop} title="Stop">
          ✕
        </button>
      ) : (
        <button className="tb-btn" onClick={onReload} title="Reload">
          ⟳
        </button>
      )}
      <button
        className="tb-btn tb-home"
        onClick={onHome}
        title={site ? `Reset to ${site.url}` : "Reset"}
      >
        ⌂
      </button>
      <form className="address-form" onSubmit={submit}>
        <input
          className="address"
          value={addr}
          spellCheck={false}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onChange={(e) => setAddr(e.target.value)}
        />
      </form>
      {nav?.title ? <span className="page-title">{nav.title}</span> : null}
    </div>
  );
}
