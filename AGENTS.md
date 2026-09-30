# Working on this fork

Charles's fork of the ra1ncord Discord Android mod. His phone (Samsung Galaxy S24, Android 16, Discord 344.x) loads
`https://github.com/TonyskalYT/rain/releases/latest/download/rain.js`. Every push to `main` runs
`.github/workflows/release.yml`, which rebuilds and republishes the `latest` release.

All custom features live in the **Cheeseburger** plugin (`src/cheeseburger/`), which hot reloads on the phone without restarting Discord.

## Rules

- Push only to `origin` (TonyskalYT/rain), branch `main`.
- Commit as Charles, with no co-author or session trailers:
  `git -c user.name="Charles" -c user.email="tonyskalyt@gmail.com" commit -m "short lowercase message"`
- No comments in fork code.
- Never bump versions. The plugin stays name "Cheeseburger", version "-69", description "Fuck discord", author TonyskalYT.
- Text shown in the app stays short, lowercase and casual. No toasts on the split button.
- Never delete GitHub Actions runs. Never force a Discord reload from code.
- Keep the core (everything outside `src/cheeseburger/`) unchanged, so the core revision printed by the build stays the same (currently `970e34e`). Any core change means Charles has to fully restart Discord instead of getting a live update.
- Cheeseburger may only import the modules listed in `src/api/hot/registry.ts` (plus relative imports inside `src/cheeseburger/`).

## Build and check

```
node scripts/build.mjs          # builds cheeseburger first, then rain.js; prints both revisions
npx eslint src/cheeseburger     # use --fix for import order
npx tsc --noEmit -p .           # filter output for src/cheeseburger
```

After pushing, check `https://github.com/TonyskalYT/rain/releases/latest/download/cheeseburger.json`.
Its `revision` should match what the build printed. Poll a few times, then stop: don't loop for minutes.
If the release comes back 404, the `latest` release was left as a draft. Push an empty commit to republish it.

## How hot reload works

- `dist/cheeseburger.js` and `cheeseburger.json` are published next to `rain.js`. The phone polls about every 10 seconds.
- When a new revision appears, the old copy's `stop()` runs, then the new copy's `start()`, with
  `globalThis.__cheeseburgerSwapping = true` during the swap.
- Anything that must survive a swap is handed off through `globalThis.__cheeseburger*`. Existing examples are split state, PiP state and the crash log.

## Safety rules (these have caused crashes before)

- Patcher hooks (before, after, instead) aren't wrapped in try/catch. A throwing hook breaks the Discord function it patches.
  Wrap every hook, timer and listener with `safe()` or `safeInstead()` from `crash.ts`.
- Errors thrown inside timers, listeners or native callbacks close the app.
- Never let an `instead` patch skip calling `orig` for a React component. Its hook count changes when the patch toggles, and React throws.
- Any component we inject gets wrapped in a small class error boundary (`Guard`).
- Android PiP throws for aspect ratios outside 0.418 to 2.39, so they're clamped in `split/pip.ts`.
- Reanimated animated style handles look like `{viewDescriptors, initial: {value}}`.

## Feature map (`src/cheeseburger/`)

| File | Feature |
|---|---|
| `index.ts`, `features.ts`, `storage.ts` | Plugin entry, feature toggles |
| `settings.tsx` | Settings page |
| `crash.ts` | Crash log in `documents/rain/cheeseburger-crash.json`, plus `safe` and `safeInstead` |
| `debug/` | One report of everything, anonymized, uploaded to Charles's private debug repo |
| `volume/` | Volume boost past 200% |
| `deafen/` | Deafen button on the call toolbar |
| `toolbar.tsx` | Clones Discord's soundboard toolbar button so the added buttons match Discord's look and colors |
| `split/` | Split view |
| `split/pip.ts` | PiP shape, smart PiP (never shows you, sticks to streams), PiP pins |
| `split/PipPin.tsx` | Pin buttons on video tiles |
| `rotate/` | Rotate button |
| `share/` | Moves "share screen" from the toolbar into the swipe-up menu |
| `style/` | GX-style bevels: top-left and bottom-right corners cut. `shapes.tsx` draws the cut shape |
| `updates/` | Hot updates and the "Update now" button |

Details for `split/`:
- `tiles.tsx` does the layout by writing each tile's `sharedCoords`.
- `layout.ts` handles focus, full screen and rotation.
- `probe.tsx` does the measuring.

## Discord internals learned from debug reports

**Call toolbar**
- Toolbar buttons: `modules/.../VoicePanelSoundboardButton.tsx` and `VoicePanelScreenshareButton.tsx`, both default exports, built on `AnimatedButtonWrapper`.
- Swipe-up menu rows: `VoicePanelVoiceControlsButtons.tsx` (ChatButton, ScreenshareButton, and others).
- Whether the call controls are showing: `modules/video_calls/native/ChannelCallStore.tsx` exports a zustand store, `useChannelCallStore`, with a `focus` flag.
  - Which value means "shown" is learned at runtime and saved as `splitViewSettings.focusWhenShown`.

**PiP**
- The PiP video comes from `external_pip/useExternalPipParticipant.android.tsx` (default export).
  - It returns `{channelId, selectedParticipantStreamId, selectedParticipantUserId, selectedParticipantSpeaking, focusedParticipantType}`. We swap those values.
  - `ExternalPipView` and `ExternalPipViewVideo` are wrapped so they re-render when a pin changes.
- The native `ExternalPip` module only has: `isSupported`, `setEnabled`, `setPipAspectRatio`, `refreshPipUi`, `setActive`. There's no support for buttons inside the PiP window.

**Participants and tiles**
- Participants come from `ChannelRTCStore.getParticipants(channelId)`.
  - `type` is 0 for a screen share (id starts with `call:`) and 2 for a user.
  - `streamId` identifies the video.
- Tile overlay buttons are `Pressable > ButtonPill > Icon` with labels like "Stop Watching" and "Focus <name>".
  - The background is `#00000085`, radius 8, and it's animated. For a real cut, the color-only animation is stripped (`stillStyle` in `style/index.tsx`).

## Debugging workflow

Charles taps **Send debug** in Cheeseburger settings. A crash also sends one automatically about 20 seconds after Discord reopens.

The report goes to his private debug repo as `latest.txt`, plus a timestamped copy in `debug/`. It's anonymized: people show up as "me" and "person N", and IDs are replaced.

Read `latest.txt` before guessing. It includes versions, settings, the call, crashes, split, PiP, style, share, volume and rotate. When something is unclear, add a line to the relevant `*Debug()` function and ask him to send again.

## Open items

- The in-app floating PiP (not Android PiP) may ignore pins. Its source isn't identified yet; the debug report logs the PiP components' inputs.
- The Messages button in the guild rail is scoped for a bevel through its "Messages" label. It's unconfirmed on the phone.
- Volume boost beyond 200% is unverified.
