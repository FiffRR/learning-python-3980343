# Repo Index: Where to Find What

Quick map of every study repo, so you (or Claude) can go straight to the right file.
Paths are relative to each repo root. "M26" = the Masters 2026 repo, "TIM" = CTI-Tim/CrestronCSharpExamples.

> All CTI code is **educational / unsupported / not production-hardened** (their own words). Use it for concepts; harden before shipping.

---

## M26 · `Moe-Abscraft/CrestronMasters26.P502.JsonFileOps` (2026, .NET 8, VC-4)
The most modern and complete structure of the lot.

| Look here | For |
|---|---|
| `instructor note/Instructor-Guide.md`, `Student-Cheat-Sheet.md` | The whole P502 lesson plan and cheat sheet |
| `backend/.../Config/ConfigManager.cs` | Safe JSON load, first-run default, `CCriticalSection`, file-watch auto-reload via `CTimer` |
| `backend/.../Config/PresetStore.cs` | Second JSON file, `JsonNamingPolicy.CamelCase` |
| `backend/.../UI/UiHandler*.cs` | Partial-class UI handler, `OnPress/OnHold/OnAnalog/OnSerial` helpers, one `Run()` lock + try/catch, `Dispose()` |
| `backend/.../Devices/DeviceEmulator.cs` | Fake switcher/DSP that raises real-looking events |
| `contract/AppContract.cce` + `output/` | Contract Editor source + generated C#/`.cse2j`/`.chd` |
| `frontend/src/app/service/controller.service.ts` | Contract names as constants, analog↔percent helpers |
| `frontend/tools/sync-contract.js` | Why WebXPanel needs `config/contract.cse2j` |

## TIM · `CTI-Tim/CrestronCSharpExamples` (zips, mostly .NET Fx 4.7.2 / 4-Series)
| Zip | For |
|---|---|
| `CSharp 205/271/303/311a/311b/317_318/319/320` | C# basics as PC console apps (casting, null, access, delegates, events, timers/async, threads, lambdas) |
| `Csharp 323 - Reflection With interfaces` | Plugin loading via interface |
| `CSharp 433 FilePaths`, `434a ReadingFiles`, `435a_b JSONFiles` | Processor paths, stream reading, Newtonsoft JSON |
| `CrestronDataStoreExample` | `CrestronDataStoreStatic` key/value persistence |
| `TouchpanelsInaList` | Panel wrapper class + list + multicast delegate |
| `HTML5CH5ModernContractExample`, `ContractWidgetListExample` | First contracts, widget lists, `sig.Pulse`, `CreateRamp` |
| `Video 450 - Crestron Drivers Completed Code` | Crestron Certified Driver: Transport + Protocol + driver JSON |
| `Getting Started with .net 8.0 ... VS2022.pdf` | Toolchain setup |
| Others (407-443, NVX, DM, IR, serial, scheduler, Fusion…) | Hardware-specific follow-ups |

## MCP-101 · `CTI-Tim/Masters2021-MCP-101` (2021)
| Look here | For |
|---|---|
| `MastersHelperLibrary/TCPClientHelper.cs` | Threaded TCP client with `CrestronQueue`; the **codepage 28591** lesson |
| `MastersHelperLibrary/VirtualConsole*.cs` | Telnet-style console for VC-4 (no built-in console there) |
| `MastersHelperLibrary/LogFileWriter.cs` | Own log file in `/user`, separate from system log |
| `Masters2021MCP101InstructorCode/ControlSystem*.cs` | Constructor vs `InitializeSystem` rules; `partial ControlSystem` to move system events out |
| PDFs: `4-Series and VC-4 C# Development Instructions`, `VC-4 Program Load HowTo`, handout, PPT | Setup and class material |

## MSS-431 · `CTI-Tim/Masters2022-MSS431` (2022)
| Look here | For |
|---|---|
| `Building a UI Framework Student files/TPBase.cs` | Mini UI framework: wrap `BasicTriListWithSmartObject`, `handleBtn` / `handleRange` per join, press/release filtering |
| `InstructorCompletedExercise/.../ControlSystem.cs` | **Join enums** (`enum Buttons { Settings = 1 … }`), SmartObject SGD loading, reflection plugin |
| `.../Config.cs`, `Password.cs` | XML config class, password hashing (see gotchas) |
| `.../ReflectionInterface`, `GetJoke`, `GetFortune` | Interface-based plugins loaded at runtime |
| `Cresnet Helper Example` | `CrestronCresnetHelper.DiscoverAllDevices()` + set IDs by TSID |
| `Ethernet Discovery Example` | `EthernetAutodiscovery.Query()` and its limits |

## MSS-421 · `CTI-Tim/Crestron-Masters-2023-MSS-421` (2023)
| Look here | For |
|---|---|
| `CrestronMasters2023CSharpClass/CWSDebug.cs` | Static debug class: rolling message buffer + CWS terminal route |
| `.../Config.cs` | Config class served over **CWS REST** (`/cws/app/settings`), JSON via Newtonsoft |
| `WebFolder/app.js`, `settings.html`, `debug.html` | Browser settings page using `fetch()` to CWS; **VC-4 path gotcha** |

## MSS-521 · `CTI-Tim/Crestron-Masters-2024-MSS-521` (2024)
| Look here | For |
|---|---|
| Root: `ControlSystem.cs`, `DeviceSetup.cs`, `Automation.cs`, `EventTimers.cs`, `MessageSystem/`, `UserInterface/` | Full conference room (AirMedia, NVX, Apple TV IR, Connected display) with message broker + contracts |
| `CrestronDriversInCSharp/M24DriversDemo/` | Load Crestron driver `.pkg`/`.dll` at runtime (reflection), CWS upload endpoint, driver browser, TCP emulator |
| `CrestronDriversInCSharp/DriverCollection/` | Your own driver interface (`IDriverInterface`) |
| `CrestronDriversInCSharp/SDK/.../Samples/` | Official Crestron Drivers SDK samples (AV switcher, Marantz AVR IP/serial) |
| `CrestronDriversInCSharp/Web/` | Upload page JS + VC-4 path regex |

## MSS-621 · `CTI-Tim/Masters2025-MSS621` (2025)
**Same room, three programmers, three architectures.** The "how do I glue it all together" class.

| Folder | Style |
|---|---|
| `Events and Delegates Solution-Jeremy/` | Direct references + events: a static `ControlSystem.global`, a `SystemPower` property whose setter runs SystemOn/Off, an `Audio` base class with `virtual` methods that `AudioTV` overrides |
| `MSS621-MarkMachado/` | Message broker, plus `Dom.cs` (a static "hold every object" class, shown as the opposite of a broker) and `LogusMaximus.cs` (one static logging entry point) |
| `Message Broker Solution-Tim/` | Broker **compiled as separate DLLs**: `MessageBroker`, `Nvx3xx`, `Airmedia3100`, `CrestronConnected` libraries referenced by the main program; `Automation`, `DeviceSetup`, `SimpleEventTimers2`, `UI/PageNavigation` |
| `MSSXpanel SourceCode/` | Construct project + `.ch5z` |

## CH5 · `CTI-Tim/CH5ExampleProjects`
| Look here | For |
|---|---|
| `mux-521-angular-complete/src/app/services/WebXPanel.ts` | WebXPanel boot, events, config from URL query (`?host=&ipid=&port=`) |
| `.../services/CrestronRouterService.ts` | Control system pulses a visibility join → Angular router navigates |
| `.../helpers/CrComLibHelpers.ts` | Typed `CrComLib` + helpers (`pulseDigital`, `setDigital`, `setAnalog`, `setSerial`) |
| `.../components/volume`, `source-list`, `d-pad`, `o-pad*`, `weather` | Components with `subscribeState` + `NgZone` + Angular signals |
| `mux-521-react-complete/src/contexts/CrComLibContext.js` | Same ideas in React (context) |
| `mpc3-201-b/` | Angular + React for an **MPC3-201-B** keypad, with SIMPL Windows program + contract |
