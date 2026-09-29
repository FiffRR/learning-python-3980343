---
name: crestron-ch5-panels
description: SOP for building Crestron CH5 / HTML5 touch panel and WebXPanel projects (Angular or React with CrComLib, Crestron Construct / Contract Editor contracts, ch5-cli archive and deploy, VC-4 hosting). Use when the user asks to create, style, debug or wire an HTML5 panel for Crestron, work with contract signal names, CrComLib subscribeState/publishEvent, WebXPanel, or .ch5z packaging.
---

# Crestron CH5 Panel SOP

Ronwen builds HTML5 panel designs for Crestron and websites as a hobby, so design quality matters as much as the wiring. Worked examples: M26 `frontend/`, CTI `CH5ExampleProjects` (`mux-521-angular-complete`, `mux-521-react-complete`, `mpc3-201-b`). See `crestron-study-plan/reference/patterns.md` §11 and `gotchas.md` P4–P6, B17.

## 1. Contract first
1. Define the contract in Construct or Contract Editor: pages/widgets → named signals (`Sources.Source[3].Name`, `MainPage.VolumeBar.Touchfb`).
2. Generate outputs: `.cse2j` (panel mapping), `.g.cs` (C#), `.chd` (SIMPL).
3. Copy the `.cse2j` into the web project so it ships as `config/contract.cse2j` (WebXPanel only looks there; use a prebuild copy script like M26 `tools/sync-contract.js`).
4. After **any** contract change: regenerate and re-import **all** `.g.cs` files in the C# project.

## 2. Wiring rules
- One constants module for every signal name (M26 `Contract` object). No string literals scattered through components.
- Typed CrComLib helpers: `pulseDigital`, `setDigital`, `setAnalog`, `setSerial` (CH5ExampleProjects `CrComLibHelpers.ts`).
- Subscribe in `ngOnInit` / `useEffect`, keep the returned id, **unsubscribe on destroy/cleanup**.
- Angular: update state inside `ngZone.run(() => this.x.set(v))`; use `signal()`/`computed()`.
- React: provide CrComLib through a context; subscribe in effects with stable deps.
- Analog ↔ UI: 0–65535 ↔ 0–100 %, clamped both ways.
- Presses: publish true on press, false on release (or `pulseDigital` for momentary).
- Page flow: let the control system decide (pulsed `...VisibilityJoin` → router navigate), and **navigate to a default page at startup** so the panel works when the processor is offline.

## 3. WebXPanel
- `getWebXPanel(!runsInContainerApp())`: only activate in a browser, not on a real panel.
- Config from URL query with defaults: `?host=<ip>&ipid=0x04&port=49200` (lowercase the IP-ID).
- Listen for `NOT_AUTHORIZED` (redirect), `CONNECT_CIP`, `DISCONNECT_CIP`, `ERROR_WS`, and show connection state in the UI.
- Never commit auth tokens.

## 4. Build and deploy
```bash
npm run build                      # ng build (prebuild copies the contract)
ch5-cli archive -c src/config/<Contract>.cse2j -p <name> -d dist/<name>/ -o archive
ch5-cli deploy -H <panel-ip> -t touchscreen   -p archive/<name>.ch5z
ch5-cli deploy -H <proc-ip>  -t controlsystem -p archive/<name>.ch5z   # WebXPanel / VC-4
```
- Some processor builds need module scripts deferred (M26 `cresprep` script replaces `type="module"` with `defer`).
- On **VC-4**, pages live under `/VirtualControl/Rooms/<ROOMID>/Html/`. Reach CWS with `../cws/...` or detect the path.

## 5. Design SOP (panels are used on 7–10" touch screens)
- Touch targets ≥ 44 px (aim 60+ on wall panels); no hover-only affordances.
- Selected/feedback state visible from across the room: fill change, not just a thin border.
- CSS custom properties for colour tokens with a dark and light set (M26 `color-variables-dark/light.css`); dark by default for rooms with projectors.
- Show control-system offline / reconnecting state.
- Icon fonts (remixicon, iconsax in M26) or inline SVG. Keep the archive small; prefer `.webp` for images.
- Test at the panel's real resolution (e.g. TSW-770 1280×800, TSW-1070 1920×1200) and in WebXPanel.

## 6. Hand-off checklist
- [ ] Contract regenerated and `.g.cs` re-imported; signal names verified in the constants file.
- [ ] Subscriptions cleaned up; no console errors in WebXPanel.
- [ ] Offline start page works; reconnect shows correct feedback (control system pushes all feedback on online).
- [ ] `.ch5z` built from a clean build and deployed; version noted.
