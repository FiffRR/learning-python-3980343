# Crestron C# Patterns: What the Repos Teach

Patterns pulled from M26 and the CTI Masters repos (2021–2025), each with where to see it and when to use it.
Sketches are trimmed to the idea. Read the source for the full version (see `repo-index.md`).

---

## 1. Program lifecycle (every program)
**Source:** MCP-101 `ControlSystem.cs` comments, MSS-621 `DeviceSetup.cs` comments, M26 `ControlSystem.cs`.

| Stage | Allowed | Not allowed |
|---|---|---|
| Constructor | Set `Thread.MaxNumberOfUserThreads`, subscribe `CrestronEnvironment` events, add console commands | Hardware access, starting threads, sending/receiving data. Must return fast |
| `InitializeSystem()` | Create/register devices, configure ports, start sockets and threads | Long blocking work. Must return fast too (CTI notes ~20 s budget) |
| Long startup work | `CrestronInvoke.BeginInvoke(StartupConfig, null)` (M26) or your own thread | |
| `ProgramStatusEventHandler` → `Stopping` | Stop timers, dispose handlers, close sockets, stop consoles | |

Tip (MCP-101): make `ControlSystem` a `partial class` and move the System/Program/Ethernet event handlers into `ControlSystemEvents.cs` to keep the main file clean.

---

## 2. Organizing a room program: three architectures (MSS-621)
The same room programmed three ways. Pick one per project and stick to it.

| Style | How classes talk | Good for | Watch out for |
|---|---|---|---|
| **Direct references + events** (Jeremy) | Objects hold references to each other; events/virtual methods | Small rooms, easy to follow in the debugger | Coupling grows; a static `global` becomes a "reach anything" crutch |
| **Static "Dom" holder** (Mark's `Dom.cs`) | One static class holds every object | Very quick to write | Everything depends on everything; hard to test or reuse |
| **Message broker** (Tim, Mark) | `Broker.SendMessage("DisplayPower", new Message{Digital=true})` → a delegate registered under that key | Decoupled classes, SIMPL-like "signal names", easy to add Fusion/scheduler triggers | String keys (typos fail silently), one listener per key, runs synchronously on the caller's thread (see gotchas) |

Common structure in the broker solutions (the useful part regardless of style):
- `DeviceSetup` creates hardware and exposes **wrapper methods** as broker listeners (e.g. `NvxSetInput(Message m) => myNvx.SetInput((Nvx.ESource)m.Analog)`).
- `Automation` holds room logic only (SystemOn/Off, SourceSelect), "like a SIMPL folder of steppers". It sends messages and never touches hardware directly.
- `UI/` classes (`MainPage`, `MediaSubPage`, `PageNavigation`, `Xpanel`) wire contract events to broker keys and handle page flips only.
- Page flips for power on/off happen in **Automation**, not the UI, so anything else (Fusion, a timer) that turns the room on keeps the panel in step.
- Tim's 2025 version compiles each device wrapper (`Nvx3xx`, `Airmedia3100`, `CrestronConnected`) and the broker as **separate class-library DLLs**. Build them once, reuse them across jobs.

Minimal broker (MSS-621 `MessageBroker/Broker.cs`, cleaned up):
```csharp
public static class Broker
{
    public delegate void MessageDelegate(Message m);
    private static readonly Dictionary<string, MessageDelegate> _map = new();
    private static readonly object _lock = new();

    public static void AddDelegate(string key, MessageDelegate method)
    { lock (_lock) { if (_map.ContainsKey(key)) throw new InvalidOperationException($"Duplicate key {key}"); _map[key] = method; } }

    public static void SendMessage(string key, Message m)
    {
        MessageDelegate? d; lock (_lock) _map.TryGetValue(key, out d);
        d?.Invoke(m);            // Invoke, not DynamicInvoke (faster, no TargetInvocationException wrapping)
    }
}
public class Message { public bool Digital; public ushort Analog; public string Serial = ""; }
```
Upgrade ideas: key constants or an `enum` instead of raw strings; a `brokermon on|off` console command to trace traffic (Tim's appliance version has one).

---

## 3. Device wrapper classes (MSS-621 `Nvx3xx/Nvx.cs`, `Airmedia3100`, `CrestronConnected`)
- Wrap the Crestron device class in **your own** class that exposes plain methods (`SetInput`, `SetStreamLocation`), feedback properties (`OnlineFeedback`, `InputFeedback`), and **one `BaseEvent`** with your own `Args`.
- Re-declare the enums you need (`EMode`, `ESource`) inside the wrapper so callers never need the Crestron namespace.
- Apply defaults in the constructor (LEDs, auto-initiation, `DisableAutomaticInputRouting`, device mode), then `Register()` and check `RegistrationFailureReason`.
- Expose the built-in ports (`NvxComPort = _myNvx.ComPorts[1]` — **Crestron collections are 1-based**; `IROutputPorts[1]`) so an IR/serial driver can ride on them (`AppleTvIr` on the NVX IR port).
- Put `/// <summary>` XML docs on public members. They show up as tooltips for whoever uses your DLL.

---

## 4. UI patterns, oldest to newest
| Era | Pattern | Source |
|---|---|---|
| Joins + enums | `enum Buttons { Settings = 1, Lock = 2 … }`, `(uint)Buttons.Settings`. Change a join in one place | MSS-431 `ControlSystem.cs`, MSS-521 drivers `JoinNumbers.cs` |
| Joins + mini framework | `TPBase` wraps `BasicTriListWithSmartObject`, `handleBtn(join, handler, press, release)`, `handleRange(start, count, handler)` passing the index | MSS-431 `TPBase.cs` |
| Panel list | Panel wrapper class in a `List<>`, multicast delegate to update all | TIM `TouchpanelsInaList` |
| Contracts (Construct) | `_myContract.HeaderBar.RoomNameLabel_IndirectText(...)`, `..._PressEvent +=`, `..._Visibility(bool)` | MSS-521/621 `UserInterface/`, TIM contract examples |
| Contracts, production-grade | Partial `UiHandler`, join helpers → one `Run()` lock/try-catch, `Dispose()` unsubscribes, push all feedback on panel online | M26 `UI/` |

Subpage visibility lab answer (MSS-521 README): hide every AV subpage, then `switch` to show one. Visibility is exclusive, so reset them all first.

---

## 5. Config and persistence options
| Option | Use for | Source |
|---|---|---|
| JSON file + `System.Text.Json` | Structured room config (.NET 8) | M26 `ConfigManager` |
| JSON file + Newtonsoft | Same on .NET Fx 4.7.2 / older SDK | TIM 435, MSS-421 `Config.cs` |
| XML + `XmlSerializer` | Legacy / when a schema matters | MSS-431 `Config.cs` |
| `CrestronDataStoreStatic` | Small key/value settings, local or global | TIM DataStore |
| Config over **CWS REST** | Let a tech edit settings in a browser | MSS-421 `Config.cs` + `WebFolder/` |

Rules that hold for all of them: lock around file I/O, write temp-then-swap, never let a bad file stop the room (fallback default), keep machine-written files apart from hand-edited ones (M26 `preset.json` vs `roomConfig.json`).

---

## 6. CWS (Crestron Web Scripting): REST endpoints in your program (MSS-421, MSS-521)
```csharp
var server = new HttpCwsServer("/app");                         // → https://<ip>/cws/app/...
var route  = new HttpCwsRoute("settings/{REQUEST}") { RouteHandler = new SettingsHandler() };
server.AddRoute(route);
if (!server.Register()) ErrorLog.Error("CWS register failed");
// Handler: class SettingsHandler : IHttpCwsHandler { public void ProcessRequest(HttpCwsContext ctx) { ... } }
```
- Route tokens (`{REQUEST}`, `{DATA}`) come through `ctx.Request.RouteData`. **Query strings (`?command=x`) are only usable at the server root `ReceivedRequestEvent`**, not inside route handlers (MSS-421 note).
- Respond promptly (`ctx.Response.Write(json, true)`) or the browser times out.
- Unregister/Dispose the server when the program stops.
- On **VC-4** the web pages are served from `/VirtualControl/Rooms/<ROOMID>/Html/`, but CWS lives elsewhere. Use relative `../cws/...` from the page, or detect `VirtualControl` in `location.pathname` (MSS-521 `Web/` regex).
- Secure it before you ship (see gotchas #S1–S3).

---

## 7. Runtime-loaded drivers and plugins (MSS-431, MSS-521, TIM 323/450)
- Define an **interface** in a shared DLL (`IpluginInterface`, `IDriverInterface`). Both the program and the plugin reference it.
- Load with `Assembly.LoadFrom(path)`, find the type implementing the interface, `CreateInstance`.
- Crestron Certified Drivers ship as `.pkg` (zip). Unzip with `CrestronZIP.Unzip`, load the `.dll`, look for `IBasicVideoDisplay` + `ITcp`, then `Initialize(IPAddress, port)`, subscribe `StateChangeEvent`, `Connect()`.
- Dispose the old driver before loading a new one.
- Driver internals (TIM 450): **Transport** (TCP/serial) + **Protocol** (`PrepareStringThenSend` wraps header/delimiter; `ValidateResponse` frames and classifies; `DeConstruct*` parses) + **driver JSON** holding the command strings.
- Test against an emulator: `DriverEmulation` (a `TCPServer` in your own program) or TIM 450's projector emulator.

---

## 8. Debugging and logging on VC-4 (no text console)
| Tool | Source |
|---|---|
| `ErrorLog.Notice/Error` → VC-4 logs. With host shell: `sudo grep "SimplSharpPro" /var/log/messages` | MSS-621 Mark `LogusMaximus.cs` |
| `VirtualConsole.Start(port)` + `AddNewConsoleCommand`. Telnet into your program; **open the port in the VC-4 host firewall**; a different port per program | MCP-101 library |
| CWS debug terminal: rolling 50-message buffer served over HTTP to a jQuery terminal page | MSS-421 `CWSDebug.cs` |
| Own log file in `/user` via `LogFileWriter` | MCP-101 library |
| Console commands (`roomconfig`, `brokerlist`, `brokermon`) on appliances | M26 guide, MSS-621 |

---

## 9. Talking to devices over TCP (MCP-101 `TCPClientHelper`)
- Worker thread + `CrestronQueue` for TX. `TX` property enqueues, `RX` event fires with data.
- **Bytes vs strings:** device protocols are bytes. If you must use strings, use **codepage 28591 (ISO-8859-1)**, which maps all 256 byte values 1:1. `ASCII` drops >127, `UTF8` rewrites them, and `1252` has holes (0x80–0x9F). Better still, keep `byte[]` end to end.
- Decode only the bytes actually received (`ReceiveData()` returns a count), not the whole buffer.

---

## 10. Discovery helpers (MSS-431)
- `CrestronCresnetHelper.DiscoverAllDevices()` → `DiscoveredElementsList` → `SetCresnetIdByTouchSettableID(tsid, id)`. **Blocking**, so run it on a thread. Keep a record of what you assigned so IDs stay stable.
- `EthernetAutodiscovery.Query(adapter)` → list model/IP; `StopLightAndPoll()` when done. You **can't** set IP tables on TSWs or other multi-entry devices this way; that needs SSH.

---

## 11. CH5 front-end patterns (CH5ExampleProjects, M26 frontend)
- Keep contract signal names in one constants file (M26 `Contract` object) or a typed helper (`CrComLibHelpers.ts`).
- `CrComLib.subscribeState('b'|'n'|'s', name, cb)` returns an id. **Unsubscribe in `ngOnDestroy`** / React effect cleanup.
- Angular: wrap callback updates in `ngZone.run(...)` (CrComLib calls from outside Angular's zone). Store state in `signal()`/`computed()`.
- `pulseDigital(join, ms)` = publish true, then false after a timeout.
- Page routing driven by the control system: C# pulses `XxxPageVisibilityJoin` → a router service navigates. **Navigate to a default page at startup** so the panel isn't blank when the processor is offline.
- WebXPanel: `getWebXPanel(!runsInContainerApp())`; read `host`, `ipid`, `port` from the URL query with sane defaults; listen for `NOT_AUTHORIZED`, `CONNECT_CIP`, `DISCONNECT_CIP`, `ERROR_WS`.
- Build: `ng build` → `ch5-cli archive -c <contract.cse2j> -p <name> -d dist/<name> -o archive` → `ch5-cli deploy -H <ip> -t touchscreen|controlsystem -p archive/<name>.ch5z`.
- Analog scaling: 0–65535 ↔ 0–100 %, clamped (M26 `toPercent`/`toAnalog`).

---

## 12. Timers
- `CTimer(callback, state, dueMs, repeatMs)` for Crestron; `System.Timers.Timer` also works (MSS-621 uses it).
- A class that owns a timer should be `IDisposable` and stop plus dispose it (MSS-621 `SimpleEventTimers2`).
- Schedules: store events as a `List<Event{Time, Message}>` and check once a minute. That allows several events at the same time, which a dictionary keyed on time can't do.
