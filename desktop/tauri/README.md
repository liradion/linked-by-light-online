# M5 Tauri v2 (WebView2) Windows proof of concept

**Engineering-only prototype.** This is not a signed installer or a Steam build.

- Windows WebView2 runs the existing game from the fixed, HTTPS remote origin. The game server remains the authoritative WebSocket v4 host. No Node game server, room tokens, cloud keys or Steamworks credentials are bundled.
- Tauri native APIs and plugins are **not exposed** to remote content; no capabilities or remote.urls grants have been configured. Adding a Tauri IPC capability later requires a separate threat-model and tests.
- No runtime environment variable changes the game's release origin. Remote content integrity and the current hosted server's version are separate release gates. The live hosted version may differ from the Stage 4 source code.
- No embedded frontend, no local/offline game simulation. Loss of internet remains an upstream page/server concern and must be physically tested before release.

Build Windows x64 on a machine with current MSVC Rust toolchain, Windows SDK and WebView2 runtime:

```powershell
cargo build --release --manifest-path desktop/tauri/src-tauri/Cargo.toml
```

Unsigned internal test binary: `desktop/tauri/src-tauri/target/release/linked-by-light-m5-tauri-spike.exe`. This build should never be presented as a Steam installer. Configure a real, isolated WSS staging origin before deciding on the production architecture.

The GitHub Actions `m5-windows-spikes.yml` produces benchmark artifacts on Windows CI when the workflow completes. Measurements are runner-only, not a substitute for physical Windows 10/11, battery, controllers, GPU telemetry or stable network.
