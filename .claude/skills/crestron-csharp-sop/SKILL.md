---
name: crestron-csharp-sop
description: Standard operating procedure for writing or structuring Crestron SIMPL# Pro (C#) control programs for 4-Series processors and VC-4, covering program lifecycle, room architecture (device wrappers, automation, message broker vs events), JSON/XML config files, threading and locking, TCP/serial device control, runtime-loaded drivers, CWS REST endpoints and VC-4 debugging. Use whenever the user asks to write, design, extend or explain Crestron C# code, a ControlSystem class, a device class/driver, a config manager, or a CWS endpoint.
---

# Crestron SIMPL# Pro SOP

Ronwen deploys Crestron AV systems daily (SIMPL Windows, SIMPL+, SIMPL#, Construct, CH5; Panasonic projectors, Aver cameras, NVX, AirMedia). Explain C# ideas by mapping them to SIMPL/SIMPL+ equivalents when it helps (e.g. `CCriticalSection` ≈ `StartFileOperations`, broker message ≈ a named signal, Automation class ≈ a folder of steppers).

Reference docs (read the relevant one before answering in depth):
- `crestron-study-plan/reference/patterns.md`: patterns with code sketches
- `crestron-study-plan/reference/gotchas.md`: platform traps and bug catalogue (IDs P*, B*, S*)
- `crestron-study-plan/reference/repo-index.md`: which study repo shows what

## 1. Before writing code
1. Confirm the **target**: VC-4 on .NET 8 (M26 style, `Crestron.SimplSharp.SDK.Program` NuGet) or 4-Series / older SDK on .NET Fx 4.7.2 (CTI style). This decides `System.Text.Json` vs Newtonsoft, nullable annotations, and paths.
2. Confirm the **UI**: contract (Construct / Contract Editor, generated `.g.cs`) or join numbers (VT-Pro/SmartGraphics).
3. Pick **one architecture** for the program (patterns.md §2) and keep to it.

## 2. Lifecycle rules (non-negotiable)
- Constructor: `Thread.MaxNumberOfUserThreads`, environment event subscriptions, console commands. No hardware, no threads, no I/O.
- `InitializeSystem()`: register devices and start work, but return quickly. Push slow work to `CrestronInvoke.BeginInvoke` or a thread.
- Handle `eProgramStatusEventType.Stopping`: stop timers, dispose UI handlers, close sockets and servers.
- Check every `Register()` result and log the failure reason with the IP-ID in hex (`{ipId:X}`).

## 3. Structure
- `ControlSystem` stays thin: create config → devices → UI → wire → go (M26 `StartupConfig`).
- One class per device **wrapper** exposing plain methods, feedback properties and one event (patterns.md §3). Re-declare enums inside the wrapper. Add XML `/// <summary>` docs.
- Room logic in an `Automation` class. UI classes only translate presses to actions and actions to feedback.
- UI handler: partial classes per area; route every join through one helper that takes the lock and catches exceptions; push full feedback when a panel comes online; unsubscribe everything in `Dispose()` (use named methods, not lambdas, for anything you must unsubscribe).
- Stable reusable pieces (device wrappers, broker) → a **class library DLL** to reuse across jobs.

## 4. Config files (JSON by default)
- Data lives outside code: room name, IP-IDs, IPs/ports, sources, displays, presets.
- Classes map 1:1 to JSON: object → class, key → property, array → `List<T>`. Bridge names with `[JsonPropertyName]` or `JsonNamingPolicy.CamelCase`.
- `Load()` **always returns something usable**: missing file → write a default; bad JSON or missing lists → log, show a status message, use the default.
- One `CCriticalSection` (or `lock`) around **every** read and write, released in `finally`.
- **Save = write `<file>.tmp` then replace the real file** (survives power loss).
- Raise change events **outside** the lock.
- Keep machine-written data (presets) in a separate file from hand-edited config.
- Paths: detect `eDevicePlatform.Appliance` → `/user/<programXX>`; VC-4 → `<AppRoot>/user`. Always `Path.Combine`.

## 5. Threads, timers, locking
- Events from devices, timers and panels arrive on different threads. Guard shared state.
- Never busy-wait. Use blocking queues (`CrestronQueue`, `BlockingCollection`) or events.
- Classes that own a `CTimer`/`Timer` implement `IDisposable`.
- Never `Thread.Sleep` on a UI/event thread.

## 6. Device comms
- Treat protocols as **bytes**. If strings are unavoidable, encode with codepage **28591**, never ASCII/UTF8/1252.
- Frame incoming data (header/delimiter), decode only the received byte count, handle partial packets.
- Include reconnect logic and a poll for feedback. Keep "fake feedback" clearly marked.
- For Crestron Certified Drivers: Transport + Protocol + driver JSON; load `.pkg` at runtime via interface + reflection (patterns.md §7). Test against an emulator first.

## 7. CWS and debugging
- CWS routes: `HttpCwsServer("/app")` + `HttpCwsRoute("x/{TOKEN}")` + `IHttpCwsHandler`. Respond fast, one response per request, dispose on stop. **Authenticate** anything that writes (gotchas S1–S3).
- VC-4: no program console. Use `ErrorLog`, VirtualConsole (open the host firewall port, one port per program) or a CWS debug page. Remove or protect debug consoles in production.

## 8. Deliver
- Comment the *why*, not the *what*; add a short README for each program.
- Before handing over code, run the `crestron-code-review` checklist on it.
- Say what couldn't be verified without hardware (registration, device responses, VC-4 behaviour).
