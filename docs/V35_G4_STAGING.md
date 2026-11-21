# G4 isolated staging: operational setup

**STATUS: READY FOR OPERATOR PROVISIONING, NOT LIVE / NOT CERTIFIED.**

A separate Render service is described by `staging/render.yaml`. This Blueprint file is intentionally *not* the production root `render.yaml`, and it has a unique service name, `autoDeployTrigger: off` and no inherited production database keys. Production remains `linked-by-light-eu`.

## Operator procedure

1. Open the Render Dashboard, start a **new Blueprint** from this repository and explicitly select `staging/render.yaml` as the Blueprint path. Render allows a customized YAML file location during Blueprint setup. Use a separate workspace or isolation controls if required by your data-handling policy.
2. Confirm the new service name and free plan. A free service sleeps after inactivity and has ephemeral local storage. No persistent rooms, backups, migration or remote-DB parity can be claimed without separately provisioned isolated storage.
3. Confirm no production Supabase, Steam credentials, cloud tokens, moderation keys or user private data are shared with this staging service. Authorize the new service manually and check the resulting real service URL.
4. Manually deploy an **exact commit** and ensure the exposed HTTPS origin responds to `/version`, `/health`, `/ready` and the `/ws` WebSocket upgrade.
5. Run `.github/workflows/g4-staging-verify.yml` manually with the actual staging URL and exact deployed SHA, or run locally with Node 22+:
   `node scripts/verify-g4-staging.cjs --url=https://YOUR-REAL-STAGING-HOST/ --expect-commit=40_HEX_COMMIT`
6. The verifier rejects the known production hostname, demands HTTPS and full SHA, checks read-only endpoints and performs a no-room WSS handshake. It does **not** test gameplay, cloud writes, invitation security or backups.
7. Schedule and record full real-device Windows/iPhone tests and a distinct isolated backup/restore drill. Do not commit raw recordings, tokens, room codes, IP or identities. Keep reviewer evidence outside GitHub.
8. G4 #26 remains HOLD until independently documented 50-pair thresholds, privacy/rights/moderation review and exact-SHA human signoff. A successful staging handshake does not remove these conditions.

Refer to [Render Blueprint reference](https://render.com/docs/blueprint-spec) for the current configuration fields and custom YAML path.
