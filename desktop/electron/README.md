# M5 Electron Windows proof of concept

**Status:** internal, unsigned prototype. NOT a Steam build, verified installer, or offline release.

## What works in the prototype

- Electron 45/Chromium window for the existing HTTPS game and WebSocket v4 server. Desktop packaging does not reimplement physics or host local multiplayer.
- Remote content has `nodeIntegration: false`, `contextIsolation: true`, renderer `sandbox: true`, `webSecurity: true`, no preload, no arbitrary webviews, blocked off-origin navigations/windows and denied sensitive permissions (a first-party sanitized clipboard write is permitted for invitation copying).
- Native Windows menu: Ctrl+R retry and F11 fullscreen. An internal error screen shows when the first-party page fails to load.
- Opt-in development mode (`M5_ALLOW_LOOPBACK_DEV=1` + `M5_GAME_URL=http://127.0.0.1:<port>/`) is **only** enabled in unpackaged Electron. All packaged binaries have a fixed HTTPS URL and cannot be redirected via environment variables.

## Windows engineering test

Run from the repository root:

```powershell
cd desktop/electron
npm install --no-audit --no-fund
npm test
npm run smoke:desktop
npm run pack:win
```

The isolated GUI smoke launches a real local game server, joins through the Electron shell and creates a room. It is a Windows CI/lab test, not a physical cross-city iPhone test.

Windows output folder: `desktop/electron/dist/LinkedByLightM5Preview-win32-x64/`. Run `LinkedByLightM5Preview.exe` from that folder; the EXE alone is not sufficient because Electron sidecar files are required. The CI uploads an unsigned ZIP under `m5-electron-UNSIGNED-win-x64`.

## Limitations and commercial release blockers

- The packaged shell loads **the currently deployed first-party service**, which can differ from branch/main; the Stage 4 code was merged with Render auto-deploy skipped. It does not bundle or select an isolated live Stage 4 staging service.
- No native Steamworks SDK, validated license, Steam App ID, purchase entitlements, signed Windows installer, automatic updater, anti-abuse review, launch approval, storefront registration, store assets or refund path.
- No physical Windows 10/11 results, Windows Defender/signing review, real gamepad test, DPI/zoom manual QA, p95 FPS/memory, or two-person cross-network review.
- GitHub Windows hosted runners are Windows Server virtual machines; passing them does not prove supported consumer hardware performance.
- Never upload a private Steam API key, signing PFX or room-token backup to the repository.
