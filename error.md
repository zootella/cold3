
# Error Handling

search tag: errorfile

## (a) Design Philosophy

We divide situations off the happy path into three categories, and each one gets a different treatment.

**Our code has a bug.** A configuration mistake, a should-be-impossible state, a logic error staff must immediately correct. We throw. The exception bubbles up uncaught through the entire stack and blows up the page. This is intentional -- a caught bug is a hidden bug. Examples: a signed-out browser somehow reached a signed-in-only code path (`toss('state')`), the action string doesn't match any known action, a value fails a type check deep in icarus. These are all situations where something is genuinely wrong with our code or deployment and we want to know immediately.

**A third-party API or service is misbehaving.** We can't control foreign code -- a wallet library, a QR code generator, a blockchain RPC, a CDN. We wrap calls to foreign code in try-catch, save the error, and return to normal flow. Within the catch, we classify: if the error is a known/expected type (network timeout, user rejected wallet signature, provider not found), we handle it inline with a user-facing message or a fallback. If the error is unknown, we rethrow it so it blows up the page like category one. The axis here is not "how important is this feature" -- showing a QR code can be critical to a user flow. The axis is "whose code is this." Our code must be perfect; their code we must protect ourselves from.

**The user did something valid but off the happy path.** Typed something that isn't an email, clicked cancel, entered the wrong password, tried a name that's already taken. This is not exceptional -- it's normal behavior that just isn't the success case. We do not throw. We return the outcome as data and the UI reacts through reactive state. On the server, this means `task.finish({success: false, outcome: 'InvalidCredentials.'})` and `return task`. On the client, the store checks `if (!task.success) return` and the component stays rendered with its current state, or shows a message.

## (b) Patterns in Use

**toss() -- application-level throw.** Defined in `icarus/level0.js`. `toss(message, watch)` throws a `TossError` (a custom Error subclass) carrying context variables for logging. Used on both client and server whenever our own code detects something is wrong. On the server, a toss inside a handler makes doorWorker catch it, log to Datadog, and return a 500. On the client, a toss bubbles through Vue's component tree to the error plugin.

**doorWorker -- server API envelope.** Every server API endpoint is wrapped in `doorWorker()` from `icarus/level2.js`. It has three nested try-catch layers. The inner layer catches any exception from the handler (including toss), saves it to an `error` variable, and passes it to `doorWorkerShut` for clean response building and Datadog logging. If shut itself fails, the middle layer logs that. The outermost layer catches anything else with `console.error('[OUTER]')`. This is the category (b) pattern applied to our own infrastructure -- the handler is treated like potentially-failing code that must not prevent the door from shutting cleanly.

**toss on server becomes a thrown FetchError on client.** When a handler calls `toss()`, doorWorker catches it, logs it, and returns a 500 response. On the client, `fetchWorker` (which uses `$fetch` from ofetch) sees the 500 and throws a `FetchError`. That FetchError bubbles up through the component, hits the `vue:error` hook, the error plugin catches it, and the page blows up. So `toss()` anywhere in server handler code does blow up the page -- it just crosses the HTTP boundary along the way.

**Task outcomes -- structured data, not exceptions.** Server handlers return a Task object with `{success, outcome, ...data}`. `outcome` is a typed string like `'NameNotAvailable.'` or `'WrongPassword.'`. The client checks `task.success` as a boolean -- if false, the UI reacts through refs and computed state (ghosting a button, showing a message). No exceptions involved. This is how category (c) situations flow.

**Catch-classify-rethrow -- third-party error triage.** Best seen in `WalletDemo.vue`. Every call to wagmi or WalletConnect is wrapped in try-catch. Inside the catch, known error names (`UserRejectedRequestError`, `ProviderNotFoundError`, `ConnectorAlreadyConnectedError`) and keyword patterns (`fetch`, `timeout`, `network`, `expired`) are handled inline with `refInstructionalMessage`. Anything unrecognized gets rethrown so it blows up the page. The `anyIncludeAny()` helper from icarus does fuzzy matching across `e.message` and `e.name`.

**Silent catch with fallback -- non-critical foreign code.** `QrCode.vue` wraps the dynamic import and SVG generation from the qrcode library in try-catch with empty catch blocks, falling back to a placeholder SVG. This isn't about the feature being unimportant -- it's about the code being foreign and the fallback being adequate.

**Button.vue -- try/finally, no catch.** The Button component wraps `await props.click(event)` in try/finally. The `finally` resets `refDoing` so the button's loading state clears regardless. There is no catch -- exceptions propagate to the error plugin. The Button doesn't decide how to handle errors; it just ensures its own UI cleanup.

**TurnstileComponent -- finally without catch.** Same pattern. The turnstile token generation uses try/finally to clear the promise cache. Exceptions propagate to whoever called `makeToken()`.

**Store load pattern -- silent on expected failure.** Stores like `credentialStore` follow: `if (!task.success) return`. The component stays rendered, and Vue reactivity updates it when store refs change. The store doesn't throw and doesn't show an error -- the task outcome simply doesn't update the refs.

**404 without error.vue.** Profile pages (`[part1]/index.vue`, `[part1]/[part2].vue`) call `setResponseStatus(useRequestEvent(), 404)` when a user isn't found, while still rendering the page normally. The page shows "not found" through reactive state. This is category (c) -- navigating to a nonexistent profile is normal behavior, not an exception.

## (c) Nuxt APIs We Use

**`app:error` hook.** Registered in `errorPlugin.js`. Fires during SSR failures, plugin initialization errors, and the first hydrate/mount on the client. On the server, the handler logs to Datadog then returns nothing -- Nuxt renders `error.vue`. On the client, it delegates to the same `handleError` function as `vue:error`.

**`vue:error` hook.** Also in `errorPlugin.js`. Fires for errors within render functions, lifecycle hooks, setup, watchers, and event handlers. Receives the error, the component instance, and an info string describing where the error occurred. On the client, `handleError` saves details to `pageStore.errorDetails` and calls `showError()`.

**`showError()`** Triggers Nuxt's fatal error state on the client, causing the entire page to be replaced with `error.vue`. Called from `errorPlugin.js` with `{status: 400, statusText: 'Page error'}`. The guard `if (pageStore.errorDetails)` ensures it's called at most once per error -- subsequent errors while already in error state are logged but don't re-trigger.

**`error.vue`** Nuxt's top-level error page. Renders when `showError()` is called (client) or when an unhandled error occurs during SSR (server). Kept deliberately minimal -- two buttons, no data fetching, no automatic redirects. The "Try to report the error" button navigates to `/error2`, which retrieves the saved details from `pageStore` and POSTs them to `/api/report` with Turnstile protection. The "Reload Site" button does `window.location.replace('/')` -- a hard reload outside Nuxt routing, breaking any potential infinite loop.

**`setResponseStatus()`** Sets the HTTP status code during SSR without triggering the error page. Used for 404 on profile pages where the page renders normally with "not found" content.

## (d) Files

**Core files about errors:**

```
error.md                                  - this document
site/app/plugins/errorPlugin.js           - global error hooks (app:error, vue:error) and showError()
site/app/error.vue                        - fatal error page (minimal, two buttons)
site/app/pages/error2.vue                 - error reporting page wrapper
site/app/components/pages/Error2Page.vue  - error reporting UI and POST to /api/report
```

**Error infrastructure -- the plumbing:**

`site/app/plugins/errorPlugin.js` -- Registers `app:error` and `vue:error` hooks. On the server, logs to Datadog. On the client, saves error details to pageStore and calls `showError()`. This is the single place where uncaught exceptions meet Nuxt's error system.

`site/app/error.vue` -- Nuxt's fatal error page. Minimal by design: two buttons, no data fetching, no redirects. "Try to report the error" navigates to /error2. "Reload Site" does `window.location.replace('/')`.

`site/app/pages/error2.vue` and `site/app/components/pages/Error2Page.vue` -- The error reporting page. Reads `pageStore.errorDetails`, POSTs to `/api/report` with Turnstile protection, then offers a hard reload.

`site/app/stores/pageStore.js` -- Pinia store that holds `errorDetails` ref. This is the bridge between the error plugin (which saves details) and the error2 page (which reads and reports them).

`icarus/level0.js` -- Defines `toss()` (line 256) and `TossError` (line 277). `toss(message, watch)` is how application code throws. TossError extends Error with a `watch` object carrying named context variables for logging.

`icarus/level2.js` -- Defines `doorWorker()` (line 714). The server API envelope with three nested try-catch layers. Catches handler exceptions, logs to Datadog via `doorWorkerShut`, and returns a clean HTTP response (500 on error).

`site/server/middleware/middleware.js` -- Server middleware with an outer try-catch (line 41). Catches exceptions during request processing so they don't blow up the middleware pipeline. Returns `undefined` to let the request continue to route handlers.

**Examples of each pattern -- good files to read:**

`site/server/api/credential.js` -- Best example of Task outcomes. Shows `validateName()` returning `{ok}`, early returns with `task.finish({success: false, outcome: 'InvalidCredentials.'})`, and `toss('state')` for the impossible case of a missing signed-in user.

`site/app/components/snippet1/WalletDemo.vue` -- Best example of catch-classify-rethrow for third-party code. Every wagmi call wrapped, known errors handled inline, unknown errors rethrown.

`site/app/components/small/QrCode.vue` -- Example of silent catch with fallback for foreign code.

`site/app/components/small/Button.vue` -- Example of try/finally without catch. Ensures UI cleanup while letting exceptions propagate.

## (e) The Error Flow

Something throws somewhere in the SPA -- a toss, a FetchError from a 500, a TypeError, anything. Nothing catches it. The exception bubbles up through the Vue component tree until it reaches the root.

Nuxt's `vue:error` hook fires (or `app:error` if this happened during startup/SSR). Both are registered in `errorPlugin.js`. The plugin's `handleError` function runs. On the server, it logs to Datadog and returns nothing -- Nuxt renders error.vue in the HTTP response. On the client, it saves the full error details (the exception, component instance, info string) to `pageStore.errorDetails`, then calls `showError({status: 400, statusText: 'Page error'})`.

`showError()` puts the entire SPA into Nuxt's error state. Whatever page was rendered is replaced with `error.vue`. The app is now broken -- some ref might be null, some store might be half-loaded, the component tree that threw is gone. That's fine, because error.vue doesn't try to use any of it. It's deliberately minimal: two buttons, no data fetching, no layout, no stores.

The user has two choices. "Reload Site" calls `window.location.replace('/')` -- a browser-level reset that kills the SPA entirely and starts a fresh page load at the domain root. The error is gone, the broken state is gone, everything starts over.

Alternatively, the user can click "Try to report the error." This navigates to `/error2`, which is a regular page we made (not a Nuxt convention -- `error.vue` is the Nuxt convention, `error2` is ours). The SPA is still in a broken state, but we're attempting to use it anyway. Error2Page reads `pageStore.errorDetails`, renders a Turnstile-protected "Report Error" button, and POSTs the details to `/api/report`. If that works, the error gets logged for staff and `pageStore.errorDetails` is cleared. If it doesn't work -- if the broken state is so broken that Turnstile or the POST throws -- then the user ends up back at error.vue again (errorPlugin catches the new error).

This is not an infinite loop because every step requires a manual click. The user's click on "Try to report" is the circuit breaker. If reporting keeps failing, the user can just click "Reload Site" (or the browser's own reload button) and start fresh. An automatic report-on-load would risk a tight loop if the reporting itself triggers an error.

**Nuxt APIs we do not use, and why.** We do not use `createError()` -- our errors originate as `toss()` or natural exceptions and bubble up to the hooks. `createError` is for when you want Nuxt to control an error's fatality. We don't -- everything is fatal by design. We do not use `clearError()` -- we exit the error state with `window.location.replace('/')`, which is a browser-level reset equivalent to closing the tab and opening a new one. This has zero dependence on Nuxt cleaning up its internal state correctly. After an error that blew up the page, we don't want to gracefully recover within the same app instance -- we want to nuke it and start fresh. We do not use `<NuxtErrorBoundary>` -- we handle third-party errors with try-catch-classify-rethrow, which is more precise than a component boundary. We do not use `useError()` or `useFetch`/`useAsyncData` error refs -- our data fetching goes through `fetchWorker` and Pinia stores.
