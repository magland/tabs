import type { Site } from "../../shared/types";

interface Props {
  sites: Site[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onManage: () => void;
  configPath: string;
}

const IS_MAC = /Mac/i.test(navigator.platform);
const MOD = IS_MAC ? "⌘" : "Ctrl";
const ALT = IS_MAC ? "⌥" : "Alt";

function shortcutHint(index: number, total: number): string | null {
  const prefix = `${MOD}+${ALT}+`;
  if (index < 8) return `${prefix}${index + 1}`;
  if (index === total - 1) return `${prefix}9`;
  return null;
}

export function Sidebar({ sites, activeId, onSelect, onManage, configPath }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">Tabs</div>
      <ul className="site-list">
        {sites.map((s, i) => {
          const hint = shortcutHint(i, sites.length);
          const title = hint ? `${s.url}\n${hint}` : s.url;
          return (
            <li key={s.id}>
              <button
                className={`site-item ${s.id === activeId ? "active" : ""}`}
                onClick={() => onSelect(s.id)}
                title={title}
              >
                <span className="site-index" aria-hidden>
                  {i + 1}
                </span>
                <span className="site-name">{s.name}</span>
                {hint ? <span className="site-shortcut">{hint}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sidebar-footer">
        <button className="edit-config" onClick={onManage}>
          Manage sites…
        </button>
        <div className="config-path" title={configPath}>
          {configPath}
        </div>
      </div>
    </aside>
  );
}
