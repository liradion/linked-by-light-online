# SteamPipe placeholder, not an active upload

The VDF template mirrors Valve's official SteamPipe `AppBuild` / `FileMapping` structure. `__STEAM_APP_ID__` and `__STEAM_DEPOT_ID__` are deliberately invalid; they cannot be used as actual Steam identifiers.

Do not use this script until the Steam Direct onboarding is completed, you have access to the game's real depot, licensing and privacy have been reviewed, and the release operator approves the exact signed Windows candidate.

Before any later upload: copy a **clean signed Windows executable + required sidecar files** into a private content directory, verify binary/signature and no credentials inside it, then substitute actual IDs inside a private copy of this VDF. Never commit a Steam login, password, API key, Steam Guard token or publisher's signed agreements.

`Preview` is set to `1` as a defense in depth to avoid actual upload, but a production SteamPipe upload needs a separate explicit release gate and a reviewed build script. This template is not a Steamworks integration and does not create an App ID.

Official Valve reference: https://partner.steamgames.com/doc/sdk/uploading
