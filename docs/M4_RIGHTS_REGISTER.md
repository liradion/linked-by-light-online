# Stage 4 — commercial rights and provenance register

**Inventory date:** 2026-11-20. This is a technical source inventory, **not** an ownership or licence certificate.

The GitHub tree of the current Stage 4 PR contained **no checked-in files** with png/jpg/svg/mp3/wav/woff/ttf/ico/mp4 extensions at the time of review. A reproducible script now scans public/ and shared/ for media and remote HTML/CSS references: `node scripts/audit-stage4-rights.js`. It explicitly reports `RIGHTS_REVIEW_REQUIRED` even when no binary assets are found.

| Surface | Observed implementation | Evidence still needed |
|---|---|---|
| Source code and story | JavaScript modules in root, shared/, public/ plus in-code dialogue | Confirm contributor agreements, source authorship, reuse permissions |
| Character and backgrounds | Procedural browser Canvas rendering (`public/visuals.js`, `public/reality-visuals.js`) | Confirm authorship of code, names, shapes, reference assets |
| Sound and music | Browser WebAudio oscillators (`public/quality.js`, `public/client.js`); no checked-in audio binary files were found | Confirm original composition/design provenance and rights to any new tracks before packaging |
| PWA app icons | Server-generated PNG drawing code (`pwa-icons.js`), not checked-in image files | Confirm logo/trademark provenance and ownership |
| Fonts and emoji | CSS `system-ui`, browser/device emoji glyphs; no checked-in font binaries | Confirm applicable platform distribution rights for packaging and brand use |
| Dependencies | `package.json` has no runtime dependencies; CI installs Playwright tooling | Document Node/runtime, app shell, Steamworks, WebView2, embedded dependency licenses |
| Community/user maps | Moderated publishing in `v21-social.js`/`server.js`; content may contain user-created titles and geometry | Moderation staffing, rights acceptance and report/removal procedures in a real beta |

**Owner action required:** Approve or replace each asset/source item with a documented rights chain. Do not mark M4/G4 commercial rights cleared solely because a test or inventory is green. No original font binaries should be shipped to users through this report.
