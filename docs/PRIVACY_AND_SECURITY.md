# Linked by Light — Security, privacy and rights checklist

Working requirements only. This file is not a legal opinion and does not certify compliance.

## Data inventory and minimization
- Inventory every path that stores: room codes/tokens, reconnect auth, game profiles, save/checkpoint files, user IDs, payment entitlements, IP-rate-limit buckets, support requests, UGC maps/notes, analytics.
- Do **not** send login tokens, room codes, raw IPs, private role hints, note contents or user identity to event analytics.
- Retain aggregated allowlisted first-experience counters (per v28 design) only with explicit administrative access and stated retention.
- Document use of device storage, Supabase, Render, Google login, App Store and payment providers.
- Define retention schedule, deletion path and export for account data; verify policy with applicable regional requirements.

## Security controls
- Preserve authoritative server simulation, room membership checks and bounded message size.
- Validate all client-origin values and action IDs; rate-limit invites, room creation, map publishing, login and feedback.
- Keep API secrets in deployment environment. Never commit production keys or write them to client JS/network diagnostics.
- Encrypted room snapshots require separated service and encryption keys; plan key rotation and a recoverable backup.
- Restore from damaged checkpoint, replayed command and network outage in staging. Never test destructive recovery on production first.
- Audit WebSocket origin/auth boundaries, stale socket permissions, escalation between host/guest and spectator data visibility.
- Monitor repeated unauthorized attempts, unexpected errors, excessive room creation and server CPU/memory.

## User-generated content
- Until moderation infrastructure is staffed/tested, disable public exposure of shared maps, notes and photos.
- Add report/removal tools, content validation, moderation queue and abuse rate limits for future publication.
- Treat any user-supplied links/text as untrusted; do not inject into DOM with `innerHTML`.
- Age rating, chat/UGC exposure and privacy notices vary by store.

## Commercial rights register (to be filled)
| Item | Owner/license | Evidence | Commercial usage | Review |
|---|---|---|---|---|
| Game source | project owner | pending | pending | ☐ |
| Character art/animation | pending | pending | pending | ☐ |
| Backgrounds | pending | pending | pending | ☐ |
| Music and SFX | pending | pending | pending | ☐ |
| Fonts and icons | pending | pending | pending | ☐ |
| Third-party dependencies | pending | pending | pending | ☐ |
| Generated imagery | pending | pending | pending | ☐ |

## Store/compliance release gates
- Privacy policy and support contact accessible without login.
- Account deletion available where required.
- Platform digital entitlements use approved store billing paths and verified backend status.
- Terms explain paid access, free invited player, content license, refunds and limitations.
- Obtain appropriate financial/tax review for selling internationally from Kazakhstan.
