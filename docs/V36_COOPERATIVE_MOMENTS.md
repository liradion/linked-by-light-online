# v36 — original co-op feedback and reduced-motion polish

Stage 4 user experience: original procedural text + sine chimes for meaningful teamwork progress.

- Server-owned checkpoint, bridge-latch and pad-latch transitions display visually distinct, bilingual milestone cues.
- Explicit accessible `role=status` with polite live announcements; **no remote analytics, telemetry, room codes, audio files or external licenses**.
- Gate-open animations and notices already exist; v36 skips gate-open events to prevent duplicate toast announcements.
- Reduced motion disables toast transforms/transitions in both operating-system and game settings.
- Touch controls remain underneath a pointer-events-none toast.
- `tests/v36-moment-feedback.test.js` and `e2e/v36-moment-feedback.spec.cjs` verify first-act transitions, data safety, localization and reduced-motion visual behavior.

No art/music rights clearance is claimed beyond new code-created visual/sine effects; a full creative/audiovisual campaign, original score, human pacing and platform certification remain separate work.
