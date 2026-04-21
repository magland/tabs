import { useState } from "react";
import type { IconRecord, Site } from "../../shared/types";

interface Props {
  sites: Site[];
  activeId: string | null;
  icons: Record<string, IconRecord>;
  onSelect: (id: string) => void;
  onManage: () => void;
  onReorder: (next: Site[]) => void;
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

export function Sidebar({
  sites,
  activeId,
  icons,
  onSelect,
  onManage,
  onReorder,
  configPath,
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Don't draw an indicator if it would mean "drop where you already are".
  const indicatorVisible =
    dragIndex !== null &&
    dropIndex !== null &&
    dropIndex !== dragIndex &&
    dropIndex !== dragIndex + 1;

  const clearDrag = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDrop = () => {
    if (dragIndex === null || dropIndex === null) {
      clearDrag();
      return;
    }
    let to = dropIndex;
    if (to > dragIndex) to -= 1;
    if (to !== dragIndex) {
      const next = [...sites];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(to, 0, moved);
      onReorder(next);
    }
    clearDrag();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Tabs</div>
      <ul className="site-list">
        {sites.map((s, i) => {
          const hint = shortcutHint(i, sites.length);
          const title = hint ? `${s.url}\n${hint}` : s.url;
          const isDragging = dragIndex === i;
          const icon = icons[s.id];
          const showAbove = indicatorVisible && dropIndex === i;
          const showBelow =
            indicatorVisible &&
            dropIndex === i + 1 &&
            i === sites.length - 1;
          const classes = [
            "site-item",
            s.id === activeId ? "active" : "",
            isDragging ? "dragging" : "",
            showAbove ? "drop-above" : "",
            showBelow ? "drop-below" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={s.id}>
              <button
                className={classes}
                onClick={() => onSelect(s.id)}
                title={title}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                  // Required for drag to register in some browsers.
                  e.dataTransfer.setData("text/plain", s.id);
                }}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mid = rect.top + rect.height / 2;
                  setDropIndex(e.clientY < mid ? i : i + 1);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop();
                }}
                onDragEnd={clearDrag}
              >
                <span className="site-index" aria-hidden>
                  {i + 1}
                </span>
                <span className="site-favicon" aria-hidden>
                  {icon ? (
                    <img
                      src={`data:${icon.mime};base64,${icon.data}`}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    s.name.charAt(0).toUpperCase()
                  )}
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
