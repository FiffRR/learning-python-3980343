# Crestron C# Self-Study Plan

Generated from `plan.json` by `tools/build.js`. Edit the JSON, not this file. The interactive checklist is `study-plan.html`, published at https://claude.ai/artifact/6YCbNS9K455DNiUkxNdwvA (progress syncs across your devices there).

**Tags:** Read · Run · Break (on purpose) · Build · Bug hunt

## Source repos

| Key | Repo |
|---|---|
| M26 | [Masters 2026 · P502 JSON & File Ops](https://github.com/Moe-Abscraft/CrestronMasters26.P502.JsonFileOps) |
| TIM | [CTI-Tim · C# Examples](https://github.com/CTI-Tim/CrestronCSharpExamples) |
| MCP-101 | [Masters 2021 · MCP-101 Fundamentals](https://github.com/CTI-Tim/Masters2021-MCP-101) |
| MSS-431 | [Masters 2022 · MSS-431 UI Framework & Discovery](https://github.com/CTI-Tim/Masters2022-MSS431) |
| MSS-421 | [Masters 2023 · MSS-421 CWS with C#](https://github.com/CTI-Tim/Crestron-Masters-2023-MSS-421) |
| MSS-521 | [Masters 2024 · MSS-521 Drivers & Contracts](https://github.com/CTI-Tim/Crestron-Masters-2024-MSS-521) |
| MSS-621 | [Masters 2025 · MSS-621 Gluing It Together](https://github.com/CTI-Tim/Masters2025-MSS621) |
| CH5 | [CTI-Tim · CH5 Example Projects](https://github.com/CTI-Tim/CH5ExampleProjects) |

Reference docs: `reference/patterns.md`, `reference/gotchas.md`, `reference/repo-index.md`.

---

## 00 · Setup (Week 0)

_A working toolchain and one scratch project you'll add every exercise to._

**Sources**
- **TIM**: Getting Started with .net 8.0 with C# for crestron in Visual studio 2022.pdf
- **MCP-101**: 4-Series and VC-4 C# Development Instructions-Mar2021.pdf, MCP-101 VC-4 Program Load HowTo.pdf

- [ ] **Read**: Read Tim's .NET 8 getting-started PDF and the MCP-101 VC-4 program load how-to
- [ ] **Build**: Install VS 2022, .NET 8 SDK, and the `Crestron.SimplSharp.SDK.Program` NuGet
- [ ] **Build**: Get a VC-4 instance you can deploy to (.NET 8 runs on VC-4, not on 4-Series hardware)
- [ ] **Build**: Install Node + `@crestron/ch5-shell-utilities-cli` for CH5 projects
- [ ] **Run**: Clone M26, build the backend, deploy to VC-4 and confirm it loads
- [ ] **Build**: Create your `StudyLab` SIMPL# Pro project; every exercise becomes a console command or class in it

---

## 01 · C# foundations & program lifecycle (Weeks 1–2)

_The C# features Crestron code leans on, and the rules for constructor vs InitializeSystem._

**Sources**
- **TIM**: CSharp 205 · 271 · 303_304 · 311a · 311b · 317_318 · 319 · 320 · 323 (PC console apps)
- **MCP-101**: Masters2021MCP101InstructorCode/ControlSystem.cs + ControlSystemEvents.cs

- [ ] **Run**: TIM 205 Casting and 271 CheckingForNull. Relate to analog ↔ percent and `?.` / `??` in M26
- [ ] **Run**: TIM 303_304 AccessModifiers. Why is every M26 class `internal` or `sealed`?
- [ ] **Run**: TIM 311a Delegates, 311b CustomEventArgs, 320 BasicLambda
- [ ] **Build**: Write `ProjectorEventArgs` (PowerState, LampHours), raise it from a fake projector, subscribe twice, unsubscribe once
- [ ] **Run**: TIM 317_318 Timers/Delay/Async. Write a 3 s delay three ways and note which one blocks
- [ ] **Bug hunt**: Spot the bugs in TIM 319 `MyWorker` (unsafe queue, busy-wait, non-volatile flag, finalizer), then fix with a blocking queue
- [ ] **Read**: MCP-101 ControlSystem comments: what's allowed in the constructor vs `InitializeSystem`, and why both must return fast
- [ ] **Build**: Make `StudyLab.ControlSystem` a `partial class` and move System/Program/Ethernet handlers into `ControlSystemEvents.cs`
- [ ] **Run**: TIM 323 Reflection with interfaces (you'll need it again in Phase 7)

---

## 02 · Files & JSON (Weeks 3–4)

_Move room data out of code: read, deserialize, use, change, serialize, write back._

**Sources**
- **M26**: instructor note/Instructor-Guide.md (Modules 1–6), Student-Cheat-Sheet.md, docs/, Config/RoomConfig.cs, Config/PresetStore.cs
- **TIM**: CSharp 433 FilePaths, 434a ReadingFiles, 435a_b JSONFiles, CrestronDataStoreExample
- **MSS-431**: InstructorCompletedExercise/.../Config.cs (XML)
- **MSS-421**: CrestronMasters2023CSharpClass/Config.cs (Newtonsoft JSON)

- [ ] **Read**: M26 guide Modules 1–3 and the cheat sheet. Do the spot-the-error JSON exercise by hand
- [ ] **Read**: Compare `docs/sample-roomconfig.json` with `.xml`, then the MSS-431 XML config vs the MSS-421 JSON config
- [ ] **Run**: TIM 433 FilePaths: app folder, `/user`, `/nvram`, `/rm`. Then read how M26 picks `/user` vs VC-4 app root
- [ ] **Run**: TIM 434a ReadingFiles: whole file vs line-by-line, `using` blocks
- [ ] **Read**: M26 Modules 4–5: map every JSON key in `RoomConfig.cs`; compare `[JsonPropertyName]` with `PresetStore`'s CamelCase policy
- [ ] **Build**: Recreate TIM 435 (`SeedData`/`WriteJSON`/`ReadJSON`/`AddRoom`) with System.Text.Json
- [ ] **Build**: Add `roomconfig` (dump) and `roomreload` (re-read) console commands
- [ ] **Break**: Break the JSON on purpose (comment, trailing comma, single quotes, `True`) and record what System.Text.Json says. Which one passes because of `AllowTrailingCommas`?
- [ ] **Run**: TIM DataStore example: when would you choose DataStore over a JSON file?
- [ ] **Build**: Model one of your real jobs as JSON (projector IP/port, Aver presets, NVX IP-IDs, sources) and write the classes

---

## 03 · Robustness: surviving the real world (Week 5)

_Power loss, thread collisions, bad files: the room must still come up._

**Sources**
- **M26**: Instructor-Guide Modules 7–8, Config/ConfigManager.cs
- **TIM**: CrestronDataStoreExample
- **MSS-421**: Config.cs Save/Load

- [ ] **Read**: Read `ConfigManager.Load()` and list every fallback path
- [ ] **Break**: Deadlock demo: move `_lock.Leave()` out of `finally`, throw, call Load twice. Then restore
- [ ] **Break**: Move `ConfigChanged?.Invoke` inside the lock with a subscriber that calls `Load()`, and explain the result
- [ ] **Run**: Enable auto-update and edit the file over SFTP while watching the panel update
- [ ] **Build**: Add `ConfigManager.Save()`: lock, write `.tmp`, replace, release in `finally`
- [ ] **Build**: Give `PresetStore.Save()` the same temp-then-swap and a try/catch in `Load()`
- [ ] **Bug hunt**: TIM DataStore: find the `&` vs `|` flags bug and the `GLobalString` typo
- [ ] **Bug hunt**: MSS-421 `Config.Load/Save`: unused XmlSerializer, double open, undisposed reader, non-atomic save. Rewrite it properly

---

## 04 · UI: joins → frameworks → contracts (Week 6)

_From raw join numbers to a production-grade contract UI handler._

**Sources**
- **MSS-431**: InstructorCompletedExercise ControlSystem.cs (join enums), Building a UI Framework/TPBase.cs
- **TIM**: TouchpanelsInaList, HTML5CH5ModernContractExample, ContractWidgetListExample
- **MSS-521**: UserInterface/ (MainPage, PageNavigation) + README subpage lab
- **M26**: contract/, UI/UiHandler*.cs

- [ ] **Read**: MSS-431 join enums (`enum Buttons { Settings = 1 … }`) and why they beat magic numbers
- [ ] **Read**: MSS-431 `TPBase`: `handleBtn` / `handleRange` with press/release filtering
- [ ] **Build**: Refactor TIM `Touchpanel.cs` to accept any `BasicTriListWithSmartObject` (answers Tim's own question)
- [ ] **Build**: Create panels from the JSON config at startup (config-driven panel list)
- [ ] **Build**: TIM Modern Contract example homework: wire the Apple TV D-pad and transport
- [ ] **Run**: TIM ContractWidgetList: item count, `_Indirect` text, per-item events
- [ ] **Build**: Do the MSS-521 subpage lab yourself (`ShowMainSubpages`) before reading the answer
- [ ] **Read**: M26 `UiHandler`: list five things that make it production-ready
- [ ] **Build**: Add `System.RoomName` to M26 end to end: Contract Editor → `.g.cs` → C# → Angular

---

## 05 · CH5 front-end (Week 7)

_Angular/React panels that are wired cleanly and look good on a wall panel._

**Sources**
- **CH5**: mux-521-angular-complete (services/WebXPanel.ts, CrestronRouterService.ts, helpers/CrComLibHelpers.ts, components/)
- **CH5**: mux-521-react-complete (contexts/CrComLibContext.js), mpc3-201-b (keypad + SIMPL)
- **M26**: frontend/ (controller.service.ts, tools/sync-contract.js, package.json scripts)

- [ ] **Read**: CH5 `WebXPanel.ts`: `runsInContainerApp`, URL query config, the four events
- [ ] **Read**: CH5 `CrestronRouterService`: control system pulses a visibility join → router navigates; default page at startup
- [ ] **Read**: CH5 `volume.component.ts`: `subscribeState` + `ngZone.run` + signals + `unsubscribeState` in `ngOnDestroy`
- [ ] **Read**: Compare the React `CrComLibContext` with the Angular service approach
- [ ] **Run**: Build and run `mux-521-angular-complete` in a browser as a WebXPanel (`?host=&ipid=&port=`)
- [ ] **Build**: Port the CH5 d-pad/o-pad components into the M26 frontend, wired to M26's contract
- [ ] **Build**: Restyle the M26 frontend with its CSS tokens for a real panel size (TSW-770 1280×800)
- [ ] **Run**: Full pipeline: `ng build` → `ch5-cli archive` → `ch5-cli deploy` to VC-4 / a panel

---

## 06 · Architecture: gluing it all together (Weeks 8–9)

_The same room programmed three ways, so you can choose a structure on purpose._

**Sources**
- **MSS-621**: Events and Delegates Solution-Jeremy/
- **MSS-621**: MSS621-MarkMachado/ (MessageSystem/, Dom.cs, LogusMaximus.cs)
- **MSS-621**: Message Broker Solution-Tim/ (MessageBroker, Nvx3xx, Airmedia3100, CrestronConnected, Automation.cs, DeviceSetup.cs, SimpleEventTimers2.cs)
- **MSS-521**: root program (the 2024 version of the same room)

- [ ] **Read**: Read the MSS-621 READMEs: the room (AirMedia, NVX as switcher + global streams, Apple TV IR, Connected display)
- [ ] **Read**: Jeremy's solution: `ControlSystem.global`, `SystemPower` setter, `Audio` base class with `virtual` methods
- [ ] **Read**: Mark's `Dom.cs` vs his MessageBroker: why the broker exists
- [ ] **Read**: Tim's solution: `DeviceSetup` wrappers → `Automation` (room logic only) → `UI/` (presses and page flips only)
- [ ] **Read**: Tim's `Nvx.cs` wrapper: own enums, defaults in constructor, `ComPorts[1]` (1-based), IR port reuse, XML docs
- [ ] **Bug hunt**: Find the bugs: `GetNvxAddress` off-by-one, `AddEvent` ignoring params, `LogusMaximus` dropping msg2, broker not thread-safe
- [ ] **Build**: Write a thread-safe broker (lock, `Invoke`, try/catch per send, key constants) plus a `brokermon` command
- [ ] **Build**: Build your own device wrapper library DLL (e.g. `PanasonicProjector`) and reference it from `StudyLab`
- [ ] **Build**: Write a one-page decision note: which of the three styles will you use for your jobs, and why

---

## 07 · Device comms & drivers (Week 10)

_Talk to real devices reliably, and load Crestron drivers at runtime._

**Sources**
- **MCP-101**: MastersHelperLibrary/TCPClientHelper.cs (+ codepage issue #1)
- **TIM**: Video 450 - Crestron Drivers Completed Code
- **MSS-521**: CrestronDriversInCSharp/ (M24DriversDemo, DriverCollection, SDK Samples)
- **MSS-431**: ReflectionInterface, GetJoke, GetFortune
- **M26**: Devices/DeviceEmulator.cs

- [ ] **Read**: MCP-101 `TCPClientHelper`: worker thread + `CrestronQueue`, and the codepage 1252 vs 28591 lesson
- [ ] **Bug hunt**: List what `TCPClientHelper` gets wrong (whole-buffer decode, spin loop, no reconnect) and write a fixed version
- [ ] **Read**: TIM 450: trace `PowerOn` from driver JSON → `PrepareStringThenSend` → `ValidateResponse` → `DeConstructPower`
- [ ] **Read**: MSS-431 reflection plugin: shared interface DLL + `Assembly.LoadFrom`
- [ ] **Read**: MSS-521 driver demo: unzip `.pkg`, find `IBasicVideoDisplay` + `ITcp`, `Initialize`, `StateChangeEvent`, `Connect`
- [ ] **Run**: Run the MSS-521 driver demo against its built-in TCP emulator (or TIM 450's projector emulator)
- [ ] **Build**: Write a Panasonic projector protocol class (power, input, power poll) behind an `IDisplay` interface
- [ ] **Build**: Swap M26's `DeviceEmulator` display side for your `IDisplay` with no UI changes

---

## 08 · Web, tools & discovery (Week 11)

_Browser settings pages over CWS, debugging on VC-4, and bus/network discovery._

**Sources**
- **MSS-421**: CWSDebug.cs, Config.cs (Cws method), WebFolder/app.js + settings.html + debug.html
- **MSS-521**: CWS/CWSManager.cs, DisplayDriverRequestHandler.cs, Web/ (VC-4 path regex)
- **MCP-101**: VirtualConsole*.cs, LogFileWriter.cs
- **MSS-431**: Cresnet Helper Example, Ethernet Discovery Example

- [ ] **Read**: MSS-421 CWS: `HttpCwsServer`, `HttpCwsRoute` with `{TOKEN}`, `IHttpCwsHandler`, root event for query strings
- [ ] **Read**: MSS-421 `app.js`: the VC-4 `../cws/` path gotcha
- [ ] **Build**: Serve your `roomConfig.json` over CWS (GET + PUT) with a small settings page, locked and written atomically
- [ ] **Build**: Add a CWS debug log (rolling 50 messages) like `CWSDebug`
- [ ] **Run**: Start MCP-101 `VirtualConsole` on VC-4 (open the host firewall port) and add a command
- [ ] **Read**: Mark's VC-4 log tip: `sudo grep "SimplSharpPro" /var/log/messages`
- [ ] **Run**: MSS-431 Ethernet discovery: list devices; note why TSW IP tables need SSH
- [ ] **Run**: MSS-431 Cresnet discovery (if you have Cresnet): run it on a thread and keep assigned IDs stable

---

## 09 · Security & code review (Week 12)

_Find what the examples leave open, and review your own code the same way._

**Sources**
- **MSS-521**: CWS/DisplayDriverRequestHandler.cs (upload + load)
- **MSS-431**: Password.cs
- **MSS-421**: Password.cs, CWSDebug.cs
- **CH5**: services/WebXPanel.ts (commented token)

- [ ] **Bug hunt**: MSS-521 driver upload: path traversal via `X-File-Name`, unauthenticated DLL load, double response. Write the hardened version
- [ ] **Bug hunt**: MSS-421/431 `Password`: hard-coded salt, SHA-1/1000 iterations, non-constant compare. Rewrite with a random salt, PBKDF2-SHA256, `FixedTimeEquals`
- [ ] **Build**: Add authentication to your CWS settings page from Phase 8
- [ ] **Build**: Make debug consoles and pages switchable off for production builds
- [ ] **Run**: Ask Claude to run the `crestron-code-review` skill on your `StudyLab` and fix every finding

---

## 10 · Capstone room program (Week 13+)

_Your own room, no copying. Refer back only when stuck._

**Sources**
- **M26**: structure to copy
- **MSS-621**: architecture options

- [ ] **Build**: `roomConfig.json`: room, panels, sources, displays (type + IP), camera presets
- [ ] **Build**: ConfigManager with lock, atomic save, safe load and auto-reload; presets in a separate file
- [ ] **Build**: Your chosen architecture (Phase 6) with device wrapper DLLs
- [ ] **Build**: Contract UI + CH5 panel from Phase 5, with offline start page and full feedback on reconnect
- [ ] **Build**: Display via `IDisplay`: emulator first, then your Panasonic driver
- [ ] **Build**: CWS settings page with auth; debug off in production
- [ ] **Build**: Clean shutdown: timers stopped, handlers disposed, sockets closed
- [ ] **Break**: Final test: restart mid-save, corrupt the JSON, unplug the panel, drop the projector. The room must recover
- [ ] **Run**: Full review with the `crestron-code-review` skill, then write the README
