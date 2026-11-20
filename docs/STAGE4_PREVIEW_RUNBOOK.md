# Stage 4 Preview — isolated browser screenshot artifact

Stage 4 is a **consumer-facing beta preparation stage**, not a public release.

## Implemented preview

The workflow `.github/workflows/stage4-visual-preview.yml` runs a real Node game server **only on the GitHub Actions runner** and starts local Chromium and WebKit browser contexts via Playwright 1.56.1. It performs the same co-op/session assertions that render the previews:

- Russian first-use desktop menu.
- Russian in-game chapters dialog after a real solo room was created and started.
- English translated in-game chapters dialog.
- iPhone-size 844×390 landscape menu.
- iPhone-size 844×390 in-game touch controls.

Screenshots are captured from actual browser rendering, not generated illustrations, and saved in the action artifact `linked-by-light-stage4-visual-preview` with 14-day retention. Any visible six-character room code is blurred before saving. Screenshots contain no authentication tokens, real accounts or external players. Chromium and WebKit are **emulated browser engines**, not physical devices.

The artifact is only a **visual preview**. It is not an interactive public game, and no live deployment URL is available through this workflow.

## How to inspect

1. Open the Stage 4 PR checks or GitHub Actions, choose **Stage 4 Visual Preview (isolated Chromium + WebKit)**.
2. Open the latest successful run for the exact Stage 4 commit.
3. Download the artifact `linked-by-light-stage4-visual-preview` in the run's Artifacts section and inspect the PNGs. The filename starts with the browser engine.

Do not share game session room codes or unredacted test artifacts.

## Separate interactive preview requirements

This game requires a persistent WebSocket server. Static Netlify/Vercel hosting of the HTML bundle alone cannot provide an equivalent functional preview.

To deploy an interactive Render Preview safely:
- Connect a provider deployment action with permissions to **view and configure** the intended Render service and its PR preview settings.
- Use an isolated staging project with **different keys** and no access to production Supabase room/profile storage.
- Verify the preview's actual HTTPS/WSS URL, `/version`, `/health`, `/ready`, WebSocket room creation + two-player join and authenticated token recovery.
- Keep it temporary. Provider previews can be destroyed when their associated PR closes. Record the exact candidate SHA and cost before provisioning.

**Do not claim an interactive preview has been deployed until a real URL is returned and tested.**

## Remaining acceptance blockers

The full M4/G4 gate still requires product rights review, moderated UGC, real iOS/Windows devices across cellular and Wi-Fi, independent 50-pair usability data and crash-free beta SLO evidence.
