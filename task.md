
# Eliminating Task

Task was built for a vision where calls would descend multiple levels of the club sandwich and return with a rich, inspectable record of everything that happened along the way. In practice, each level examines the result of the most recent call down and decides what to do — local variable state, not a deep wrapper. The ceremony Task adds (constructor, metadata, finish method, auto-detect logic) isn't earning its keep. We're removing it.

What Task does today: stamps `.tag`, `.tick`, `.sticker`, and `.finish()` onto a plain object. `.finish()` records `.done` and `.duration`, and runs 17 lines of auto-detect logic to bubble `.success` up from `.response.success`, `.result.success`, or `.error`. The object is non-POJO because of the `.finish()` method, which `doorWorkerShut` works around with `makePlain(response)`.

What we actually use: `.success` (everywhere), `.outcome` (credential and totp handlers), `.duration` (one place — mainStore reads it from the load api response), and custom properties pinned by each handler. Everything else — `.name`, `.tag`, `.tick`, `.sticker`, `.done`, the auto-detect logic, TaskError, tossTask — is dead weight.

## Stage 1: Remove dead code ✅

Removed: TaskError, tossTask, Task test block, door.task (created and finished but never read), stale ttd comments. Tests pass.

## Stage 2: Trivial de-Task — handlers that only use success

Three worker API handlers use Task purely as `{}` with `.success = true` at the end. No `.duration`, no `.outcome`, no early returns. Mechanical replacement.

| File | Pattern |
|---|---|
| hit.js | Pins `.hits`, finishes with success |
| render.js | Pins custom properties, finishes with success |
| report.js | Pins custom properties, finishes with success |

Also convert `persephone.js warm()` — trivially returns `{success: true}`.

**Before:**
```javascript
let task = Task({name: 'hit api'})
task.hits = await settingReadInt('hits', 0)
task.finish({success: true})
return task
```

**After:**
```javascript
let response = {}
response.hits = await settingReadInt('hits', 0)
response.success = true
return response
```

Smoke test after batch.

## Stage 3: Non-trivial de-Task — handlers with duration, outcome, early returns, or try/catch

These need individual attention:

**credential.js** — Largest handler. Many early-return failures with `.outcome` like `task.finish({success: false, outcome: 'InvalidCredentials.'}); return task`. Becomes `return {success: false, outcome: 'InvalidCredentials.'}`.

**load.js** — mainStore.js:20 reads `.duration`. Needs manual `duration: Now() - t`.

**otp.js** — Has conditional Task creation.

**persephone.js sendMessage** — Wraps four third-party messaging APIs. Creates a Task, passes it into provider-specific functions that set `.request`, `.response`, and `.success`, catches errors into `.error`, calls `.finish()`, and audits.

**level2.js sendLog (datadog)** — Fire-and-forget. Nobody reads the result. Remove Task entirely, keep try/catch.

**level2.js checkTurnstileToken** — On failure, audits and tosses with `{task}`. Change to pass relevant pieces directly.

## Stage 3b: The OTP and messaging chain

The remaining five `Task(` calls live in one connected chain: a user requests a code on the page, the worker validates and calls `otpSend` in level3.js, which calls the lambda's `sendMessage` in persephone.js, which calls one of four third-party APIs. Each level creates its own Task, and they all need converting.

### persephone.js sendMessage

The deepest call site. sendMessage creates a Task, passes it as a mutable accumulator into one of four provider functions (`sendMessageAmazonEmail`, `sendMessageTwilioEmail`, `sendMessageAmazonPhone`, `sendMessageTwilioPhone`), catches errors, finishes, audits, and returns the whole thing.

The Task here serves as a bag of: `.parameters` (from/to addresses derived from inputs), `.request` (provider-specific request shape), `.response` (raw API response), `.success` (set by each provider function after inspecting the response), and `.error` (caught exception). The provider functions read from `task.parameters` and write to `task.request`, `task.response`, and `task.success`.

Refactor: replace `Task(...)` with a plain object. The `.parameters` property stays — it's how the provider functions get their inputs. Keep `.request`, `.response`, `.error` for the audit log. Add manual `.duration`. The four provider functions change `task` → `task` (same parameter name is fine — it's still a plain object they mutate). The `task.finish()` call becomes `task.duration = Now() - t`. The audit log `logAudit('message', {task})` stays as-is since it's logging a plain object now.

The caller in message.js does `return await sendMessage(...)` — the return value flows through doorLambdaShut's `makePlain()`. With Task gone it's already plain, so makePlain is a harmless no-op. The worker caller (otpSend, line 230) does `await fetchLambda(...)` and discards the result.

### level3.js otpSend

Two Task calls in this function:

1. **Line 198: `Task({name: 'otp permit'})`** — Created at the top, used for early returns when rate limiting. The properties read by the caller (otp.js) are `.success` and `.reason` (`'CoolHard.'` or `'CoolSoft.'`). Then at line 264 this task is thrown away and a new one is created for the success path. Refactor: replace with `return {success: false, reason: 'CoolHard.'}` directly. No accumulator needed.

2. **Line 264: `Task({name: 'otp send'})`** — Created only on the success path (after sending). Just `task.success = true; return task`. Becomes `return {success: true}`.

### level3.js otpEnter

One Task call at line 271. Every branch returns the task with `.success` and optionally `.reason` and `.lives`. All early returns. Refactor: direct `return {success: false, reason: 'Expired.'}` or `return {success: false, reason: 'Wrong.', lives}` or `return {success: true}`.

### otp.js doorHandleBelow

The consumer of otpSend and otpEnter. Three branches set `let task`:

- `SendTurnstile.` → `task = await otpSend(...)` — gets a response object
- `FoundEnvelope.` → `task = Task({name: 'otp found envelope'}); task.success = true` — becomes `task = {success: true}`
- `Enter.` → `task = await otpEnter(...)` — gets a response object

After the branches, shared code pins `.envelope` and `.otps` onto the task, then `task.finish(); return task`. With plain objects this becomes `task.success = true` (wait — success is already set by each branch). Actually, the shared code doesn't set success — each branch already has it. The `task.finish()` call currently runs bubble-up logic, but every branch already sets `.success` explicitly, so it's inert. Remove `task.finish()` and just `return task`.

The page components read from the response: `.otps` (array of challenge info), `.envelope` (encrypted cookie), `.success` (checked implicitly by fetchWorker), `.reason` (`'CoolSoft.'`, `'CoolHard.'`, `'Wrong.'`, `'Expired.'`), and `.lives` (remaining guesses).

### Execution order

Work bottom-up:

1. **persephone.js sendMessage** — convert Task to plain object, keep the provider function pattern, keep audit
2. **level3.js otpSend** — replace two Task calls with direct returns
3. **level3.js otpEnter** — replace Task with direct returns
4. **otp.js** — replace FoundEnvelope Task with `{success: true}`, remove `task.finish()`, rename `task` to `response`

After these four, zero `Task(` calls remain outside the definition itself. Stage 5 cleanup can proceed.

## Stage 4: Standardize response conventions

After Task is gone, establish naming conventions for return objects. Not enforced, not a class — just uniform patterns across handlers.

**Response from a worker handler** (returned to page via fetchWorker):
- `.success` — boolean, always present
- `.outcome` — action-style string when success is false, describing what happened: `'InvalidCredentials.'`, `'NameNotAvailable.'`, `'WrongPassword.'`
- custom properties as needed: `.hits`, `.userName`, `.cycles`, etc.
- `.duration` — optional, only if the caller needs it (currently just load api)

**Response from a lambda** (returned to worker or page via fetchLambda):
- same conventions

**The fetchProvider try/catch pattern** (for third-party APIs):
```javascript
let response
try {
    response = await fetchProvider({url, options: {...}})
} catch (e) { /* log, handle, or toss */ }
```
No wrapper object. The try/catch IS the pattern. If the caller needs to audit, it passes the pieces it cares about.

## Stage 5: Cleanup

Once all call sites are converted:

- Remove `Task` and `_taskFinish` from level2.js
- Remove `Task` from the barrel export in index.js
- Remove `Task` from level3.js import
- Remove `Task` from the three auto-import blocks (icarusServerPlugin.js x2, icarusComposable.js)
- Remove `Task` from persephone.js import
- Update the fetchProvider essay example (the one you just wrote) to not use Task
- Delete this file (task.md)
