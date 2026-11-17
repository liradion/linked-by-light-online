# Linked by Light — game design and vertical slice specification

**Status:** prototype first-act demo code exists in PR #17, not yet human playtested. See [DEMO_VERTICAL_SLICE.md](DEMO_VERTICAL_SLICE.md).

**Status:** design candidate. Stage index 0–136 exists; no claim that every stage is commercially polished.

## Existing structure (verified in code)
- `shared/stages.js`: **99 base missions** arranged as 11 acts × 9 missions, including three named introductory stages: `Первый контакт`, `Мост доверия`, `Один ритм`.
- `GameStages.BONUS_STAGE`: secret stage index 99.
- `shared/v20-stages.js`: 12 further stages indexed 100–111.
- `shared/v21-stages.js`: 10 stages 112–121.
- `shared/v23-stages.js`: 15 stages 122–136.
- Many base missions are generated from repeated task archetypes; raw stage count is not a proxy for novelty or completion time.

## Core experience
**Unique selling point:** a sincere, accessible distant co-op adventure with warm orange Spark and cyan Echo. Two players must coordinate despite device differences; both have moments of agency and impact.

### Control and role contract
- Spark: movement + jump + dash/breakable wall.
- Echo: movement + jump + pulse/crystal interaction.
- Shared: connection/bond/emote and chapter-specific abilities.
- Base touch HUD: ◀ ▶ ↑ ✦, with compact contextual menu for bond, emote, v20 tether/phase/time and late-chapter systems.
- No gameplay-critical action may be available only through a hidden technical version menu.
- In private game session, closing menu or switching chapters must release held inputs.

## Vertical slice — existing levels to validate
1. **Stage 0: Первый контакт** — learn two floor pressure plates, communicate, enter portal together. Make visual cues unambiguous.
2. **Stage 1: Мост доверия** — Spark breaks wall and holds pad; Echo reaches crystal across bridge. Strong first asymmetric collaboration.
3. **Stage 2: Один ритм** — sequential plus simultaneous coordination, readable hazards, two pads.
4. **Stage 3+** — select 2–5 representative higher-quality trials from act 1 and later distinctive worlds after playtest; no assumed stage index until acceptance.
5. **Final slice beat** — memorable cooperative resolution, short narrative scene, positive invitation to continue.

**Target duration:** 20–30 min after individual learning pace; test rather than assuming pacing.

## Stage review rubric (0–5 each)
- Clear objective and feedback
- Both players need agency
- Unique mechanic vs prior stage
- Fair challenge and recovery
- Device parity and control discoverability
- Network tolerance
- Aesthetic/story relevance

Scoring: `≥26/35` candidate keep; `20–25` polish; `<20` redesign or move to optional content. This is a proposed review rule, not an existing dataset.

## Required stage registry fields (planned)
`stageIndex, chapter, title, objective, mechanic, secondaryMechanic, essentialInputIds, expectedMinutes, levelStateSchema, requiredRoles, failureRecovery, hint, completionMarker, bugSeverity, playtestScore, status, reviewer`.

## Game accessibility rules
- Contrast not solely dependent on hue; Spark/Echo labeled distinctly.
- Hazards are telegraphed with motion/sound and reduced-motion substitutes.
- Full remapping for keyboard/gamepad and customizable touch size/position.
- Hint stage escalation when stuck, not forced success.
- Reduce visual occlusion during simultaneous puzzle events; menu not blocking gameplay.
- Safe-area insets on wide phone screens.

## Content scope decisions
Before release choose a coherent 2–4h curated campaign. Keep extra rooms, cards, social systems and generated missions as optional if they meet quality bars. Do not market "137 premium levels" until passed by independent reviewers.

## Structured playtest form
Pair ID (pseudonymous), device/OS, network geography category, join completion, first objective completion, observed fail states, confusion points, control reachability, 1–5 enjoyment, 1–5 clarity, intent to replay/purchase, optional written note with consent.
