# Gotchas & Bug Catalogue

Real defects and traps found while reading the study repos. Every one is a good "spot the bug" exercise, and every one is a checklist item for reviewing your own code.
IDs are used by the `crestron-code-review` skill.

---

## Platform gotchas (no bug, just traps)
| ID | Gotcha | Fix / rule |
|---|---|---|
| P1 | 4-Series hardware doesn't run .NET 8 (at time of M26). .NET 8 → **VC-4** | Match target framework to the platform. Older CTI code is .NET Fx 4.7.2 |
| P2 | File roots differ: `/user` on an appliance vs `<app root>/user` on VC-4. `/nvram` is legacy | Detect with `CrestronEnvironment.DevicePlatform` (M26 `ConfigManager`). Always `Path.Combine`, never `"\\"` |
| P3 | VC-4 has **no text console** for your program | `ErrorLog`, VirtualConsole (open host firewall port), CWS debug page |
| P4 | VC-4 serves HTML from `/VirtualControl/Rooms/<ROOMID>/Html/`; CWS is elsewhere | Relative `../cws/...` or detect `VirtualControl` in the path |
| P5 | WebXPanel fetches `config/contract.cse2j` (fixed name) | Copy/rename at build (M26 `sync-contract.js`) |
| P6 | A contract member missing in C# = not enabled in Construct | Enable, rebuild, **re-import all** `.g.cs` |
| P7 | Crestron port collections are **1-based** (`ComPorts[1]`) | Don't index from 0 |
| P8 | `EthernetAutodiscovery` can't set IP tables on TSWs / multi-entry devices | Use SSH for those |
| P9 | Cresnet/Ethernet discovery calls **block** | Run on a thread, not in `InitializeSystem` |
| P10 | CWS query strings are only readable at the server root event, not in route handlers | Put data in route tokens or the body |
| P11 | System.Text.Json is strict and case-sensitive (no comments, no trailing commas unless enabled) | `[JsonPropertyName]` or `PropertyNamingPolicy`; enable `AllowTrailingCommas` if humans edit the file |
| P12 | VirtualConsole port collides if two programs use the same one | Different port per program slot |

---

## Bugs found in the example code
| ID | Where | Bug | Fix |
|---|---|---|---|
| B1 | M26 `ConfigManager` (default write), `PresetStore.Save()` | Direct `File.WriteAllText`, so power loss leaves a torn file. The guide teaches temp-then-swap but the code doesn't do it yet | Write `.tmp` → replace, inside the lock |
| B2 | M26 `PresetStore.Load()` | No try/catch: a corrupt `preset.json` throws into the UI handler | Catch, log, return empty |
| B3 | TIM DataStore | `OWNERREADWRITE & OTHERREADWRITE`: flags combined with `&` (likely 0) | Use `|` |
| B4 | TIM DataStore | `clearGlobal("GLobalString")` typo, so it clears a key that doesn't exist | Use constants for keys |
| B5 | TIM 319 `MyWorker` | Non-thread-safe `Queue` across threads; busy-wait 100 % CPU; non-`volatile` stop flag; relies on finalizer | `BlockingCollection`/`CrestronQueue` with blocking dequeue; `CancellationToken` |
| B6 | MCP-101 `TCPClientHelper` | Codepage **1252** (holes at 0x80–0x9F); decodes whole `IncomingDataBuffer` instead of received count; loop spins; thread exits on first disconnect | Codepage 28591 or `byte[]`; use `ReceiveData()` count; blocking/async receive; reconnect logic |
| B7 | MSS-621 `Broker` | `Dictionary` not thread-safe; `DynamicInvoke` slow and wraps exceptions; one listener per key; an exception in a listener aborts the rest of the caller's sequence (Tim's own comment) | Lock, `Invoke`, try/catch per send, or a multicast / `List<>` per key |
| B8 | MSS-621 `Automation.GetNvxAddress` | `index > Count` should be `>=`, so off-by-one → `ArgumentOutOfRangeException`; also empty list | `if (index < 0 || index >= list.Count) return fallback;` |
| B9 | MSS-621 `SimpleEventTimers2.AddEvent` | Ignores its parameters, always adds `SystemOff @ 22:00` | Use `TimeOfEvent`, `Message` |
| B10 | MSS-621 Mark `LogusMaximus` (error branch) | Format string only has `{0}`, so `msg2` is silently dropped | `"{0} {1}"` |
| B11 | MSS-431/421 `Password` | Hard-coded salt, default PBKDF2 (SHA-1, 1000 iterations), `string.Equals` compare. The comment argues a hard-coded salt is safer; standard practice disagrees | Random per-password salt stored with the hash, PBKDF2-SHA256 with high iterations, `CryptographicOperations.FixedTimeEquals` |
| B12 | MSS-421 `Config.Load()` | Creates an unused `XmlSerializer`; opens the file twice; `TextReader` never disposed; `Save()` not atomic, no lock | One `using` reader; lock; temp-then-swap |
| B13 | MSS-521 `DisplayDriverRequestHandler` | **Security:** file name from `X-File-Name` header used straight in a path (path traversal) and the uploaded DLL is **loaded and executed**, with no authentication; also writes both OK and ERROR responses | Require auth, `Path.GetFileName`, whitelist extension, size limit, one response |
| B14 | MSS-431 `ControlSystem` | SGD path built with `@"{0}\{1}"` (Windows separator) | `Path.Combine` |
| B15 | TIM 435 JSONFiles | Writes to `/rm` (removable media) with no lock / atomic write; `AddRoom` doesn't check args | `/user`, lock, validate input |
| B16 | TIM `Touchpanel.cs` | Hard-coded `Tsw760` type limits reuse (the code itself asks the question) | Take `BasicTriListWithSmartObject` |
| B17 | CH5 `WebXPanel.ts` | Commented-out hard-coded JWT `authToken` left in source | Never commit tokens; pass at runtime |

---

## Security SOP (from S-findings above)
- **S1 Authenticate every CWS route** that changes state or accepts files. Default-deny.
- **S2 Never trust request data for paths.** `Path.GetFileName`, extension whitelist, fixed target folder.
- **S3 Don't load code that was uploaded over the network** unless it's authenticated and signed.
- **S4 Passwords:** salted PBKDF2-SHA256 with high iterations, constant-time compare, never log them. Config JSON must not hold plaintext passwords.
- **S5 VirtualConsole / debug pages are wide open** (no auth). Disable or protect them in production builds.
- **S6 No secrets in source control**: tokens, passwords, customer IPs.
