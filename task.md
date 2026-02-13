
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
