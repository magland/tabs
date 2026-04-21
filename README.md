# Tabs

A small Electron browser with a fixed, configurable set of site tabs in a left sidebar. Clicking a sidebar entry always shows the same tab — no endless-tab creep — and a Home button resets that tab to its configured URL. Sessions/cookies persist, so you stay logged in across restarts.

Built for the workflow where you live inside a handful of web apps (GitHub repos, Gmail, issue trackers) and want a keyboard-driven, predictable way to switch between them.

<img width="1296" height="820" alt="image" src="https://github.com/user-attachments/assets/1ed7f0b4-fff2-4669-b9be-19d829ff0f15" />

## Features

- One persistent tab per configured site; switching never spawns new tabs
- Back / forward / reload / home (reset-to-home-URL) + address bar per tab
- Logins persist (`persist:tabs` session partition)
- In-app shortcuts: `Ctrl+Alt+1..9` or `Ctrl+1..9` to switch; `Ctrl+PageUp`/`Ctrl+PageDown` to cycle
- Graphical "Manage sites" dialog: add / rename / reorder / delete, saved to a JSON config
- Single-instance lock: running the launcher twice focuses the existing window (so a GNOME keyboard shortcut can raise the app on Wayland)

## Install (Linux / GNOME)

```
npm install
npm run build
npm run install-app
```

That writes:

- `~/.local/bin/tabs-browser` — launcher that invokes the built app
- `~/.local/share/applications/tabs-browser.desktop` — so **Tabs** appears in GNOME Activities

To bind a key that focuses the app from anywhere (works on Wayland because GNOME dispatches it with an xdg-activation token):

**Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → +**
- Name: `Focus Tabs`
- Command: `gtk-launch tabs-browser`
- Shortcut: your choice

On Wayland, Electron's `globalShortcut` API cannot grab system-wide keys — registering the shortcut at the GNOME compositor level via Settings is the supported path.

After editing code, rebuild with `npm run build`; the installed launcher runs the rebuilt `out/` in place — no reinstall needed.

## Configuration

Sites live in `~/.config/tabs-browser/sites.json`:

```json
{
  "sites": [
    { "id": "github", "name": "GitHub", "url": "https://github.com" },
    { "id": "gmail",  "name": "Gmail",  "url": "https://mail.google.com" }
  ]
}
```

IDs are stable React keys (preserve them when editing by hand to avoid reloads). Or use **Manage sites…** in the sidebar — the GUI auto-generates IDs and writes the file for you.

## Development

```
npm run dev        # electron-vite dev server with HMR
npm run build      # production bundle into out/
npm run typecheck  # tsc across main, preload, renderer
```

## License

MIT.
