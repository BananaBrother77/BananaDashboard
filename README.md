# BananaDashboard

A desktop system dashboard built with Electron. Think of it like a server dashboard (Pterodactyl, Cockpit) but for your local Linux machine. Works on Windows and macOS too.

## Features

- **Overview** -- System info at a glance: OS, kernel, CPU, RAM, uptime
- **Resources** -- Live CPU, RAM, and disk usage graphs with configurable refresh rate
- **Theme system** -- Five color themes (purple, green, red, yellow, blue) that persist across sessions
- **Multi-language** -- English and German UI, switchable on the fly
- **Discord Rich Presence** -- Shows your current tab and system status in Discord
- **Auto-updates** -- Checks for new versions on startup, manual download flow with progress bar
- **Settings** -- Theme picker, language toggle, refresh rate control, version info, update management, Discord RPC toggle
- **Loading screen** -- Animated splash with logo and spinner while system info loads

### Planned

- Network tab (interfaces, IPs, live bandwidth)
- Battery tab
- Process manager
- Startup apps
- File manager (with future SFTP support)
- Website statistics from BananaBrother77 services

## Tech Stack

- **Runtime**: Node.js (latest LTS)
- **Desktop**: Electron 43+
- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks, no bundler)
- **Charts**: Chart.js 4.x via CDN
- **Icons**: Lucide via CDN
- **Font**: Poppins (Google Fonts)

## Getting Started

### Prerequisites

- Node.js (latest LTS)
- npm

### Install

```bash
git clone https://github.com/BananaBrother77/BananaDashboard.git
cd BananaDashboard
npm install
npm start
```

### Development

```bash
npm start
```

The app starts with an auto-hidden menu bar (press Alt to show it). Tab shortcuts: 1-9 on your keyboard.

## Building

### Linux

```bash
npm run build -- --linux
```

Output in `dist/`:
- `.AppImage` -- portable, runs on any distro
- `.deb` -- Debian/Ubuntu packages
- `.pacman` -- Arch Linux packages

Install the pacman package:

```bash
sudo pacman -U dist/bananadashboard-1.0.0.pacman
```

After installing, you may need to log out and back in to pick up the icon in KDE.

### macOS

```bash
npm run build -- --mac
```

Output: `.dmg`

### Windows

```bash
npm run build -- --win
```

Output: NSIS installer (`.exe`)

## Auto-Updates

The app uses `electron-updater` to check for new versions from GitHub Releases on startup. When an update is available:

1. A status bar shows "Update available (vX.X.X)"
2. Click **Download Update** to download in the background
3. Once downloaded, the button changes to **Restart & Install**
4. Click to restart and apply the update

You can also manually check from **Settings > Updates > Check for Updates**.

## Discord Rich Presence

BananaDashboard can show your current tab and activity in your Discord status. Enable/disable it from **Settings > Discord Rich Presence**.

If Discord is running, the app connects automatically and updates presence every 15 seconds with per-tab descriptions (e.g., "Monitoring system resources", "Browsing files").

## Project Structure

```
BananaDashboard/
├── meow.js              # Electron main process (window, IPC, system info)
├── preload.js           # Context bridge (secure IPC)
├── src/
│   ├── index.html       # Main app shell
│   ├── style.css        # All styles (design system)
│   ├── app.js           # Renderer logic
│   ├── translations.js  # i18n (en/de)
│   ├── reveal.js        # Scroll animations
│   └── assets/          # Icons
├── modules/
│   ├── resources.js     # Live resource monitoring (Chart.js)
│   └── discord.js       # Discord RPC via raw IPC socket
├── package.json
└── README.md
```

## Security

- `contextIsolation: true`, `nodeIntegration: false`
- All Node.js communication goes through the preload context bridge
- No `remote` module usage
- Content-Security-Policy is not set (local-only app)

## Architecture

The renderer communicates with the main process exclusively through `window.dashboardAPI`, which is exposed via `contextBridge` in `preload.js`. Each API method maps to an IPC channel. The main process handles all native system operations (os, child_process, fs).

## License

ISC
