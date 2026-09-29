---
name: crestron-code-review
description: Review checklist for Crestron SIMPL# Pro C# programs and CH5/HTML5 panel code, built from real bugs found in CTI Masters (2021-2025) and Crestron Masters 2026 example code. Use when the user asks to review, audit, debug or "check" Crestron C# code, a device driver, a config/JSON file handler, a CWS endpoint, or a CH5 Angular/React panel, or before delivering Crestron code you wrote.
---

# Crestron Code Review

Go through the checklist in order and report findings **most severe first**, each with file:line, the failure scenario (what breaks on site), and the fix. Cite the catalogue ID from `crestron-study-plan/reference/gotchas.md` when a finding matches one (e.g. "B7-style broker exception"). Read that file first.

## 1. Will the room come up? (critical)
- [ ] Constructor does no hardware, thread or I/O work; `InitializeSystem` returns fast (slow work offloaded).
- [ ] Every `Register()` result checked and logged with IP-ID.
- [ ] Config load **cannot throw out**: missing file → default, bad JSON → default + message, null lists handled.
- [ ] Discovery / network / file calls aren't blocking startup.

## 2. Files and persistence
- [ ] One lock around every read and write; `Leave()`/lock release in `finally`.
- [ ] Writes are atomic (temp → replace), not direct `WriteAllText` (B1, B12).
- [ ] Every file load has try/catch + fallback (B2).
- [ ] Paths use `Path.Combine` and the platform-correct root (P2, B14). Not `/rm` or `/nvram` for new work.
- [ ] Streams/readers disposed (`using`).
- [ ] Hand-edited vs machine-written files kept separate.

## 3. Threads and events
- [ ] Shared collections/state touched from events, timers or threads are locked (B5, B7).
- [ ] No busy-wait loops; no `Thread.Sleep` in event handlers.
- [ ] Stop flags are `volatile` or cancellation tokens; no reliance on finalizers.
- [ ] Events raised outside locks; subscribers can't deadlock by calling back in.
- [ ] Every `+=` has a matching `-=` in `Dispose` (named methods, not lambdas). Contract events subscribed once, not per panel.
- [ ] Timer owners are `IDisposable` and disposed on program stop.
- [ ] One exception in a handler can't stop a whole sequence (wrap per join / per message).

## 4. Logic slips seen in the wild
- [ ] Bounds checks use `>=` Count (B8).
- [ ] Methods actually use their parameters (B9).
- [ ] Format strings have a placeholder for every argument (B10).
- [ ] Flags combined with `|`, tested with `&` / `HasFlag` (B3).
- [ ] String keys (DataStore, broker, contract names) are constants, not repeated literals (B4).
- [ ] Crestron 1-based collections indexed from 1 (P7).
- [ ] Analog scaling clamped 0–65535 / 0–100.

## 5. Device comms
- [ ] Byte-safe encoding (28591 or `byte[]`), not ASCII/UTF8/1252 (B6).
- [ ] Decodes only bytes received; handles partial frames and delimiters.
- [ ] Reconnect on drop; commands queued, not lost silently; feedback polled or clearly "fake".

## 6. Security (flag even in demo code)
- [ ] CWS routes that change state or accept uploads are authenticated (S1).
- [ ] No request data used directly in file paths (S2, B13).
- [ ] No runtime loading of network-uploaded DLLs without auth/signing (S3).
- [ ] Passwords: random salt, PBKDF2-SHA256 with high iterations, constant-time compare, never logged (B11, S4).
- [ ] Debug consoles/pages off or protected in production (S5).
- [ ] No tokens/passwords/customer IPs committed (S6, B17).

## 7. CH5 / HTML5 panels
- [ ] Every `subscribeState` has an `unsubscribeState` on destroy/cleanup.
- [ ] Angular: CrComLib callbacks wrapped in `ngZone.run`.
- [ ] Signal names match the contract exactly (one constants file).
- [ ] Panel shows a sensible default page when the processor is offline.
- [ ] `config/contract.cse2j` present in the build (P5); WebXPanel host/ipid/port not hard-coded for production.
- [ ] Relative CWS paths work on VC-4 and appliances (P4).

## 8. Maintainability (lower priority)
- [ ] Device wrappers hide Crestron types; room logic lives in one place.
- [ ] XML docs on public members; comments explain *why*.
- [ ] Join numbers in enums/constants, not magic numbers.

Close with a one-line verdict (ship / fix first / rework) and say what can only be verified on hardware or VC-4.
