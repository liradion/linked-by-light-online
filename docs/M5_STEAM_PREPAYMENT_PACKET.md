# M5 — Steam Direct pre-payment handoff

**Candidate:** GitHub PR for branch `feat/m5-steam-prepayment-kit` (no Steam product or payment created).
**Scope:** only things that can be prepared without a Steamworks App ID, Valve partner access, banking/tax identity and explicit payment approval.

## Product data already in source

| Item | Source | Status |
|---|---|---|
| RU/EN short store copy, detailed description, trailer outline | `steam/prepayment-metadata.json`, `docs/STORE_COPY_RU_EN.md` | DRAFT — needs human editorial/claim review |
| Steam graphical capsules (4 standard sizes) | `scripts/generate-steam-concepts.cjs` | Generatable originals — design and rights review pending |
| Steam library images, logo and client icons (6 formats) | Same generator | Generatable originals — design and rights review pending |
| Authentic 1920×1080 game screenshots (5) | `e2e/steam-prepayment-capture.spec.cjs` | Chromium isolated-local gameplay captures; frames need human review and level variety improvement |
| Automated media dimensions/provenance validation | `scripts/validate-steam-assets.cjs` | Testable; not a legal rights review |
| Steam Direct agreement-to-payment instructions | `steam/STEAM_DIRECT_BEFORE_PAYMENT_RU.md` | Prepared — owner logs in and personally signs |
| SteamPipe draft with invalid AppID/depot placeholders | `steam/steampipe/` | Inert preview template, not installable as live depot |
| Windows app | PR #27: Electron/Tauri source, unsigned Electron NSIS & Tauri EXE | M5.1 internal only; not a signed commercial RC |
| Complete real partner account & signed distribution contract | Official Steamworks | NOT accessible/NOT verified |

## Reproducible CI pipeline

GitHub Actions `.github/workflows/m5-steam-prepayment.yml` runs inside an isolated Playwright Ubuntu container. It starts a local test server, captures real game frames, renders original concept images, validates exact image dimensions, and publishes temporary review-only artifacts. Screenshots contain no actual customer room codes. It does not access the live Render server or upload to Steam.

Local reproduction (with Playwright 1.56.1 installed):

```bash
npm install --no-save --ignore-scripts @playwright/test@1.56.1
node scripts/generate-steam-concepts.cjs
npx playwright test e2e/steam-prepayment-capture.spec.cjs --project=Chromium
node scripts/validate-steam-assets.cjs
node scripts/audit-steam-prepayment.cjs
```

Generated files exist **only** under `artifacts/steam-prepayment/` (CI temporary output). They are not committed as proof of approved graphics and may expire from GitHub Actions. Re-run the workflow for a fresh editable reference.

## Human owner work still essential before the fee

1. Decide whether publishing rights belong to an individual or a registered organization; confirm the legal name exactly matches official/bank documentation. Do not send IDs, tax numbers, bank numbers or Steam Guard to GitHub/chat.
2. Review content/source/logo/music rights, display name and Steam graphical asset guidelines. A first-party procedural illustration is not automatically a trademark clearance.
3. Approve actual gameplay frames and all store claims, support mailbox, privacy and age/disclosure details. Frame dimensions alone are not editorial approval.
4. Sign into official Steam Direct, read and personally accept the NDA and Steam Distribution Agreement, then **stop at the Steam Direct payment step**.

## Unavoidable after-fee/after-account tasks

Valve's own published onboarding order is digital paperwork → Steam Direct app fee → banking/tax/identity verification → create/configure product, store page, App ID, depots, Steamworks SDK and submission. The team cannot truthfully finish these now without real account access and the payment decision.

## Steam technical release boundary

Do not treat this packet as completing M5/G5. Issues #25, #26 and #28 stay open until the authorized owner can document actual Steamworks integration, a signed installer, physical Windows 10/11 tests, regional network play, commercial rights and Steam review. In particular, an unsigned first-party remote-website wrapper is not automatically Steam-ready.

### Official Valve documentation (verified 2026-11-20)

- Onboarding: https://partner.steamgames.com/doc/gettingstarted/onboarding
- Steam Direct: https://partner.steamgames.com/steamdirect
- Art sizes: https://partner.steamgames.com/doc/store/assets
- Real screenshot rules: https://partner.steamgames.com/doc/store/assets/standard
- Coming Soon review: https://partner.steamgames.com/doc/store/coming_soon
- SteamPipe: https://partner.steamgames.com/doc/sdk/uploading

**Stop point:** No login, contract acceptance, fee, bank/tax form, Steam App ID, Steam upload, public Render deploy or store release was made in this repository.
