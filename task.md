
# Eliminating Task

Task was built for a vision where calls would descend multiple levels of the club sandwich and return with a rich, inspectable record of everything that happened along the way. In practice, each level examines the result of the most recent call down and decides what to do — local variable state, not a deep wrapper. The ceremony Task adds (constructor, metadata, finish method, auto-detect logic) isn't earning its keep. We're removing it.

What Task does today: stamps `.tag`, `.tick`, `.sticker`, and `.finish()` onto a plain object. `.finish()` records `.done` and `.duration`, and runs 17 lines of auto-detect logic to bubble `.success` up from `.response.success`, `.result.success`, or `.error`. The object is non-POJO because of the `.finish()` method, which `doorWorkerShut` works around with `makePlain(response)`.

What we actually use: `.success` (everywhere), `.outcome` (credential and totp handlers), `.duration` (one place — mainStore reads it from the load api response), and custom properties pinned by each handler. Everything else — `.name`, `.tag`, `.tick`, `.sticker`, `.done`, the auto-detect logic, TaskError, tossTask — is dead weight.

## Stage 1: Remove dead code

TaskError and tossTask are never called. Remove them.

```
icarus/level0.js:267  //ttd comment
icarus/level0.js:268  function tossTask(task) { ... }
icarus/level0.js:280  class TaskError extends Error { ... }
```

Also remove the Task test block in level2.js (lines 482-496) — it tests Task behavior we're eliminating.

Smoke test: `pnpm test` (or however tests run) to confirm nothing references these.

## Stage 2: Refactor simple Task call sites to plain objects

Six worker API handlers use Task as a glorified `{}`. They create a Task, pin properties, call `task.finish({success: true})`, and return. Replace with a plain object and explicit `.success = true`.

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

Call sites to convert (all in `site/server/api/`):

| File | Name | Notes |
|---|---|---|
| hit.js | 'hit api' | Straightforward |
| load.js | 'load api' | mainStore reads `.duration` — add `duration: Now() - t` manually, or drop it |
| render.js | 'render api' | Straightforward |
| report.js | 'report api' | Straightforward |
| credential.js | 'credential api' | Largest handler — many early-return failures with `.outcome` |
| otp.js | 'otp found envelope' | Has conditional Task creation |

For load.js: mainStore.js:20 reads `r.duration`. Either keep a manual `response.duration = Now() - t` or remove the display of server duration. Decide at the time.

For credential.js: the pattern `task.finish({success: false, outcome: 'InvalidCredentials.'}); return task` becomes `return {success: false, outcome: 'InvalidCredentials.'}`. Simpler.

Also convert `persephone.js warm()` — trivially returns `{success: true}`.

Smoke test after each file or batch.

## Stage 3: Tackle the non-trivial call sites

Three remaining callers use Task's try/catch pattern with `.response` and `.error`:

**persephone.js sendMessage** — wraps four third-party messaging APIs (Amazon SES/SNS, Twilio/SendGrid). Currently creates a Task, passes it into provider-specific functions that set `.request`, `.response`, and `.success`, catches errors into `.error`, calls `.finish()`, and audits.

Refactor: the task object becomes a plain response object. The try/catch stays (it's essential for foreign APIs). The provider functions set `.success` directly. Duration calculated manually if the audit log wants it.

**level2.js sendLog (datadog)** — wraps fetchProvider. Currently creates a Task, pins `.response`, catches `.error`, calls `.finish()`. Nobody reads the result — sendLog is fire-and-forget.

Refactor: remove Task entirely. Keep the try/catch. The catch block is the only thing that matters (protecting our code from datadog failures).

**level2.js checkTurnstileToken** — wraps fetchProvider. Creates a Task, pins `.response`, checks `.success`, catches `.error`, calls `.finish()`. On failure, audits and tosses with `{task}`.

Refactor: plain response object. The audit log currently receives `{task}` — change to pass the relevant pieces directly.

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
- Remove `door.task = Task(...)` from doorWorkerOpen and doorLambdaOpen
- Remove `door.task.finish()` from doorWorkerShut and doorLambdaShut
- Update the fetchProvider essay example (the one you just wrote) to not use Task
- Delete this file (task.md)
