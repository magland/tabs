import { useCallback, useEffect, useState } from "react";
import type { Site } from "../../shared/types";

interface Props {
  initialSites: Site[];
  onClose: () => void;
  onSave: (sites: Site[]) => Promise<void>;
  onOpenJson: () => void;
}

interface DraftSite {
  id: string;
  name: string;
  url: string;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `site-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function SitesManager({ initialSites, onClose, onSave, onOpenJson }: Props) {
  const [draft, setDraft] = useState<DraftSite[]>(() =>
    initialSites.map((s) => ({ id: s.id, name: s.name, url: s.url }))
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const update = (idx: number, patch: Partial<DraftSite>) => {
    setDraft((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const remove = (idx: number) =>
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  const add = () =>
    setDraft((prev) => [...prev, { id: newId(), name: "", url: "" }]);
  const move = (idx: number, delta: number) => {
    const target = idx + delta;
    setDraft((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    setError(null);
    const cleaned: Site[] = [];
    for (let i = 0; i < draft.length; i++) {
      const d = draft[i];
      const name = d.name.trim();
      let url = d.url.trim();
      if (!name || !url) {
        setError(`Row ${i + 1}: name and URL are required.`);
        return;
      }
      if (!/^[a-z]+:\/\//i.test(url)) url = "https://" + url;
      cleaned.push({ id: d.id, name, url });
    }
    const ids = new Set<string>();
    for (const s of cleaned) {
      if (ids.has(s.id)) {
        setError(`Duplicate id: ${s.id}`);
        return;
      }
      ids.add(s.id);
    }
    setSaving(true);
    try {
      await onSave(cleaned);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [draft, onSave, onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Sites</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          {draft.length === 0 ? (
            <div className="modal-empty">No sites yet.</div>
          ) : (
            <ul className="sites-editor">
              {draft.map((s, i) => (
                <li key={s.id} className="sites-editor-row">
                  <span className="sites-editor-index">{i + 1}</span>
                  <div className="sites-editor-fields">
                    <input
                      className="sites-editor-name"
                      placeholder="Name"
                      value={s.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                    />
                    <input
                      className="sites-editor-url"
                      placeholder="https://example.com"
                      value={s.url}
                      spellCheck={false}
                      onChange={(e) => update(i, { url: e.target.value })}
                    />
                  </div>
                  <div className="sites-editor-actions">
                    <button
                      className="icon-btn"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => move(i, 1)}
                      disabled={i === draft.length - 1}
                      title="Move down"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      onClick={() => remove(i)}
                      title="Delete"
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-add" onClick={add}>
            + Add site
          </button>
        </div>
        {error ? <div className="modal-error">{error}</div> : null}
        <div className="modal-footer">
          <button className="btn btn-link" onClick={onOpenJson} disabled={saving}>
            Open JSON…
          </button>
          <div className="spacer" />
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
