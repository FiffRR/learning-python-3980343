# Crestron C# Self-Study Plan
### Masters 2026 P502 (JSON & File Ops) + CTI-Tim C# Examples

**Two sources, used together:**

| Short name | Repo | What it gives you |
|---|---|---|
| **M26** | `Moe-Abscraft/CrestronMasters26.P502.JsonFileOps` | One modern, complete .NET 8 program: JSON config → contract → Angular CH5 panel → device emulator. Includes the instructor guide + cheat sheet. |
| **TIM** | `CTI-Tim/CrestronCSharpExamples` | ~45 small, single-topic examples (zips). Great for isolating one concept at a time. |

**How to use this plan**
- ~8 weeks at 3–5 hrs/week. Do the phases in order; weeks are a guide, not a rule.
- Each phase: **Read → Run → Break → Build**. Don't skip "Break" — it's where the learning sticks.
- Keep one scratch SIMPL# Pro project (.NET 8, VC-4) called `StudyLab` and add every exercise to it as a console command. By the end it's your personal toolbox.
- Tick the boxes as you go. Bring any file to Claude and ask *"why is it done this way?"*

---

## Phase 0 — Setup (Week 0, ~2 hrs)

- [ ] Read TIM `Getting Started with .net 8.0 with C# for crestron in Visual studio 2022.pdf`
- [ ] VS 2022 + .NET 8 SDK + `Crestron.SimplSharp.SDK.Program` NuGet (M26 uses 2.22.15)
- [ ] VC-4 instance you can deploy to (a 4-Series processor doesn't run .NET 8 yet, so .NET 8 means VC-4)
- [ ] Node + `@crestron/ch5-shell-utilities-cli` for the M26 `frontend/`
- [ ] Clone M26, open `backend/...slnx`, build it. Deploy to VC-4 and confirm it loads.
- [ ] Heads-up: most TIM examples target **.NET Framework 4.7.2 / VS2019 / 4-Series**, and the early ones (2xx/3xx) are **plain console apps** you can run on your PC with zero Crestron hardware.

---

## Phase 1 — C# Foundations that Crestron code leans on (Weeks 1–2)

Run these as console apps on your PC. Short, fast wins.

| # | TIM example | Concept | Where you'll see it again in M26 |
|---|---|---|---|
| 1 | `205 - Casting` | int/ushort/string conversions | Analog 0–65535 ↔ percent (`toPercent`/`toAnalog` in `controller.service.ts`) |
| 2 | `271 - CheckingForNull` | null checks, `?.`, `??` | `RoomConfig?`, `ConfigChanged?.Invoke(...)` — M26 has `<Nullable>enable</Nullable>` |
| 3 | `303_304 - AccessModifiers` | public/private/internal | Every M26 class is `internal`/`sealed` — ask yourself why |
| 4 | `311a - Delegates` | delegates, multicast | `OnPress`/`OnHold` helpers in `UiHandler.cs` return delegates |
| 5 | `311b - CustomEventArgs` | your own events | `ConfigManager.ConfigChanged`, `DeviceEmulator.RoutingChanged` |
| 6 | `320 - BasicLambda` | lambdas, `Find`, `Exists` | `Run(name, () => ...)` everywhere in `UiHandler` |
| 7 | `323 - Reflection With interfaces` | interfaces, loading drivers | Foundation for Phase 5 drivers |
| 8 | `317_318 - Timers Delay Async Await` | `Thread.Sleep` vs timer vs `await Task.Delay` | `CTimer` file-watcher in `ConfigManager.EnableAutoUpdate` |
| 9 | `319 - IntroToThreading` | threads + queues | Why M26 locks every join in `Run()` |

**Exercises**
- [ ] **1.1** After #5: write `ProjectorEventArgs` with `PowerState` + `LampHours`, raise it from a fake projector class, subscribe twice, then unsubscribe one. Compare with how M26 `Dispose()` unsubscribes — and read its comment on why lambdas can't be unsubscribed.
- [ ] **1.2** After #8: write the same 3-second delay three ways. Note which one **blocks** the thread. On a processor, blocking = a frozen panel.
- [ ] **1.3 Spot the bugs in `319 MyWorker.cs`** (it's intentionally simple):
  - `Queue<string>` is shared between two threads with no lock → not thread-safe.
  - `while (_threadRun)` spins at 100% CPU when the queue is empty (busy-wait).
  - `_threadRun` isn't `volatile`, so the thread may never see `Stop()`.
  - Relying on the finalizer `~MyWorker()` to stop a thread is unreliable.
  - **Fix it:** use `ConcurrentQueue`/`BlockingCollection` (or Crestron's `CrestronQueue`) with a blocking dequeue, and a clean `Stop()`.

---

## Phase 2 — Files & JSON basics (Weeks 3–4)

Now switch to M26's instructor guide (`instructor note/Instructor-Guide.md`) and do **Modules 1–6**, with TIM examples as side-by-sides.

| Step | Read | Run / Do |
|---|---|---|
| 2.1 | M26 Guide Modules 1–3 + `Student-Cheat-Sheet.md` | Do the **spot-the-error** exercise in Module 3 by hand |
| 2.2 | M26 `docs/sample-roomconfig.json` vs `docs/sample-roomconfig.xml` | Write 3 reasons you'd pick one over the other for *your* jobs |
| 2.3 | TIM `433 - FilePaths` | Run `BuildFilePaths`. Learn the 4 locations: app folder, `/user`, `/nvram`, `/rm` |
| 2.4 | M26 `ConfigManager` constructor | See how it picks `/user` on a 4-Series vs app root on VC-4. Why `programXX` subfolders? (multiple programs on one box) |
| 2.5 | TIM `434a - ReadingFiles` | Read line-by-line vs whole file. Note the `using` block closing the stream |
| 2.6 | M26 Guide Modules 4–5, `Config/RoomConfig.cs` | Map every JSON key to its C# property; find each `[JsonPropertyName]` |
| 2.7 | TIM `435a_b - JSONFiles` | Same idea with **Newtonsoft** (`JsonConvert`) — older .NET Framework style |
| 2.8 | M26 `Config/PresetStore.cs` | Uses `JsonNamingPolicy.CamelCase` instead of attributes — the other way to bridge naming |

**Exercises (in `StudyLab`)**
- [ ] **2.A** Recreate TIM 435's `SeedData`/`WriteJSON`/`ReadJSON`/`AddRoom` commands but with **System.Text.Json** and M26's `JsonSerializerOptions`. Note the differences vs Newtonsoft.
- [ ] **2.B** Add a `roomconfig` console command (dump live config) and `roomreload` (re-read file) — exactly what M26's guide says the instructor demos with.
- [ ] **2.C Break it on purpose:** add a comment, a trailing comma, single quotes, `True` instead of `true`. Record which ones System.Text.Json rejects and what the error says. Then note: M26 sets `AllowTrailingCommas = true` — so one of those *won't* fail. Which?
- [ ] **2.D** Model a real project of yours as JSON: projector IP/port, Aver camera presets, NVX IP-IDs, source list. Write the C# classes for it.

---

## Phase 3 — Robustness: making it survive the real world (Week 5)

M26 Guide **Modules 7–8**. This is the most valuable part of the class.

- [ ] **3.1** Read `ConfigManager.Load()` top to bottom. List every way it falls back to a default instead of crashing.
- [ ] **3.2** Read `CCriticalSection` + `try/finally`. Do the guide's **deadlock demo**: move `_lock.Leave()` out of `finally`, throw inside, call Load twice. Watch it hang. Put it back.
- [ ] **3.3** Why does `ConfigChanged?.Invoke` happen **outside** the lock? (Read the comment. Then try moving it inside and have a subscriber call `Load()`.)
- [ ] **3.4** Understand `EnableAutoUpdate`: a `CTimer` checks the file's write time every second — edit the file via SFTP and watch the panel update live.

### Homework — gaps the guide describes but the code doesn't do yet
The guide teaches **write-temp-then-rename** for power loss, but the current M26 code still writes directly:
- [ ] **3.H1** `ConfigManager` writes its default with `File.WriteAllText(_filePath, ...)`. Add a `Save(RoomConfig)` that: takes the lock → writes `roomConfig.json.tmp` → swaps it over the real file → releases in `finally`. (Cheat sheet has the pattern.)
- [ ] **3.H2** `PresetStore.Save()` writes directly too — give it the same temp-then-swap.
- [ ] **3.H3** `PresetStore.Load()` has **no try/catch** — a corrupted `preset.json` throws. Make it log and return an empty dictionary instead. Test by writing garbage into `preset.json`.
- [ ] **3.H4** Compare with TIM `CrestronDataStoreExample` — a different persistence option (key/value, no files). When would you use DataStore instead of JSON? (Small single values vs structured config.)
- [ ] **3.H5 Spot the bugs in TIM DataStore example:**
  - `GlobalAccess = OWNERREADWRITE & OTHERREADWRITE` — flags are combined with `|`, not `&`. `&` of two different flags is likely `0` (no access).
  - `clearGlobal("GLobalString")` — capital L typo, so it clears a key that doesn't exist.

---

## Phase 4 — UI: from join numbers to contracts (Week 6)

Progression from "old way" to "M26 way":

| Step | Source | Lesson |
|---|---|---|
| 4.1 | TIM `TouchpanelsInaList` | Wrap a panel in a class, keep a `List<>` of panels, multicast delegate to update all at once. Classic join-number style (`BooleanInput[join]`). |
| 4.2 | TIM `HTML5CH5ModernContractExample` | First contract: `_myContract.AddDevice(tp)`, `PressEvent`s, `sig.Pulse`, `CreateRamp` for volume. Has a **homework** comment: wire the Apple TV D-pad + transport. Do it. |
| 4.3 | TIM `ContractWidgetListExample` | Widget lists: `Set_Number_Of_Items`, indexed `_Indirect` text, per-item touch events (`ItemEventArgs.ItemIndex`). |
| 4.4 | M26 `contract/AppContract.cce` + `UI/Contract/*.g.cs` | A full contract with arrays (`Sources.Source[i].Name`) — the same idea as 4.3 at scale. |
| 4.5 | M26 `UI/UiHandler*.cs` | Production structure: **partial classes** per area, `OnPress/OnHold/OnAnalog/OnSerial` helpers, one `Run()` = one lock + one try/catch, `Dispose()` unsubscribes everything. |
| 4.6 | M26 `frontend/` | Angular + CrComLib side: `controller.service.ts` contract names, `tools/sync-contract.js` (why the file must be `config/contract.cse2j`), npm `build:archive` / `deployt` / `deployp`. |

**Exercises**
- [ ] **4.A** TIM's `Touchpanel.cs` asks *"Tsw760 is specific… is there a more generic class?"* Answer it: M26 uses `BasicTriListWithSmartObject`. Refactor TIM's class so it accepts **any** panel/XPanel.
- [ ] **4.B** Combine 4.1 + Phase 2: load the panel list (IP-IDs, type) from **JSON** and create them all at startup. Config-driven panels.
- [ ] **4.C** In M26, add a new contract item (e.g. `System.RoomName`) end-to-end: Contract Editor → regenerate → copy `.g.cs` into backend → set it from `RoomConfig.RoomName` → show it in an Angular component.
- [ ] **4.D** Compare M26's `UiHandler` to TIM's Modern example. List 5 things M26 does that make it production-ready (hint: locking, error catch per join, dispose, feedback on panel online, events subscribed once not per panel).
- [ ] **4.E (HTML5 hobby tie-in)** Restyle the M26 frontend using its CSS variables (`color-variables-dark/light.css`) — perfect overlap with your panel design work.

---

## Phase 5 — Devices & drivers (Week 7)

| Step | Source | Lesson |
|---|---|---|
| 5.1 | M26 `Devices/DeviceEmulator.cs` | A fake switcher/DSP that raises the same events a real driver would. The UI never knows the difference. |
| 5.2 | TIM `Video 450 - Crestron Drivers Completed Code` | Crestron Certified Driver framework: **Transport** (TCP) + **Protocol** (build commands / parse responses) + a **JSON driver file** (`CTI_IP_Display.json`) holding the command strings. Includes emulators + SIMPL + VTPro to test. |
| 5.3 | TIM `Video-432 TCP_IP_DirectSocket` (optional download) | Raw TCP client without the driver framework. |

**Exercises**
- [ ] **5.A** In the 450 driver, trace one command: `PowerOn` in the JSON (`"PON"`) → `PrepareStringThenSend` wraps header/delimiter → response → `ValidateResponse` → `DeConstructPower`. Draw it.
- [ ] **5.B** Write a **Panasonic projector** protocol class in the same shape (you know those commands from the field). Start with power on/off + input + power polling.
- [ ] **5.C** Put an interface in front of it (`IDisplay` with `PowerOn/Off`, `PowerChanged` event) — Phase 1 #7 (interfaces) pays off here.

---

## Phase 6 — Capstone (Week 8+)

Build **your own** small room program, no copying — refer back only when stuck:

- [ ] `roomConfig.json` holds: room name, panel IP-IDs, sources, displays (with type + IP), camera presets
- [ ] `ConfigManager` with lock + temp-then-swap save + safe load + auto-reload (Phase 3)
- [ ] Panels created from config (4.B), contract-based UI with a `UiHandler` structured like M26
- [ ] Display control through `IDisplay` → emulator first, then your real Panasonic driver (Phase 5)
- [ ] Presets saved to a separate `preset.json` (like M26)
- [ ] Clean shutdown: `ProgramStatusEventHandler` → stop timers, `Dispose()` handlers
- [ ] **Final test:** pull power / restart program mid-save, corrupt the JSON, unplug the panel. Room must still come up.

Bring it to Claude for a full code review when done.

---

## Quick reference — which TIM zips matter for this plan

Downloaded & reviewed: 205, 271, 303_304, 311a, 311b, 317_318, 319, 320, 323, 433, 434a, 435a_b, CrestronDataStoreExample, TouchpanelsInaList, HTML5CH5ModernContractExample, ContractWidgetListExample, Video 450 Drivers, .NET 8 PDF.

Good follow-ups later (large, hardware-specific): 407 CheckingIfSupports, 413 EthernetHelper, 419 SmartObjects, 420 EISC to SIMPL, 421 Relays/Keypad, 422 IR, 423 Serial, 427 Infinet EX, 432 TCP direct socket, 436 DM Frame, 438 NVX, 439 NVX Director, 440 Scheduler, 443 Lamp hours, Simpl+ Delegate & HTTP, OpenWeather, FusionDemoCode, SACN sender, CEC with NVX, the full Presentation Suite program.

> Note: TIM's code is marked **educational / no support** and some targets older 3-Series/VS2008. Treat it as concept demos; treat M26 as the modern structure to copy.
