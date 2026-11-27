# v38 release stabilization — first increment

## Scope
Issue #42 recorded an intermittent WebKit click timeout after the actionability check and scrolling. The historic run succeeded after a retry. Its artifact listing now returns no traces, so the exact original root cause is unverified.

This candidate addresses a code-inspection risk: the desktop menu overlay vertically centered overflowing content without an explicit scroll container, while the menu entrance animation translated the entire interactive card. The change makes the initial menu scrollable, centers content only when space permits, and uses an opacity-only entrance. It does not change gameplay, authorization, WebSocket protocol, saves or production configuration.

## Evidence
- Real-input solo entry and start regression on desktop, short desktop and touch landscape, in both Chromium and WebKit.
- Dedicated zero-retry, three-repeat run includes the pre-existing v30 onboarding cases. A successful run demonstrates the tested scenarios, not a guarantee that the historic flake cannot recur.
- Full existing CI remains mandatory before integration. Preserve failing traces and investigate rather than force-clicking or extending timeouts.

## Release boundary
Do not close issue #42 solely from source edits. Review the exact-head zero-retry and full CI results first. No Render production deploy in this increment. The live G4 staging service must be separately provisioned and verified per docs/V35_G4_STAGING.md; physical cross-device play and the real beta cohort remain external evidence. No G4/G5 certification is implied.
