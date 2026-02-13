<script setup>

/*
  ___ _ __ _ __ ___  _ __ ___ 
 / _ \ '__| '__/ _ \| '__/ __|
|  __/ |  | | | (_) | |  \__ \
 \___|_|  |_|  \___/|_|  |___/

🪲 We throw for bugs in our own code. A caught bug is a hidden bug. toss('state') when a signed-out browser reaches a signed-in code path, toss('action') when the action string is unrecognized, toss deep in icarus when a type check fails. The exception bubbles up uncaught and blows up the page. This is intentional.

💣 We catch around foreign code. Wallet libraries, QR generators, blockchain RPCs -- we can't control their quality. We wrap every call in try-catch and classify inside the catch: known errors (network timeout, user rejected signature, provider not found) get handled inline with a message or fallback. Unknown errors get rethrown so they blow up the page like bugs. The axis isn't how important the feature is -- a QR code can be critical. The axis is whose code it is.

😭 We don't throw for users off the happy path. Wrong password, name taken, invalid email -- that's normal behavior, not an exception. The server returns task.finish({success: false, outcome: 'WrongPassword.'}) and the client checks if (!task.success) return. The UI reacts through refs and computed state. No exceptions involved.

./site/app/plugins/errorPlugin.js  - app:error and vue:error hooks, saves details to pageStore, calls showError()
./site/app/stores/pageStore.js     - holds errorDetails between the plugin and error2
./site/app/error.vue               - Nuxt's fatal error page, deliberately minimal, no custom components
./site/app/pages/error2.vue        - auto-reports the error with Turnstile, then hard-replaces home

Something throws. A toss, a TypeError, a ReferenceError -- anything uncaught. If it happens on the server, doorWorker catches it, logs to Datadog, and returns a 500. On the client, $fetch sees the 500 and throws a FetchError. So a server-side toss becomes a client-side exception -- it crosses the HTTP boundary and keeps bubbling.

The exception reaches Nuxt's error hooks (vue:error or app:error), both registered in errorPlugin.js. On the server, the plugin logs to Datadog and Nuxt renders error.vue in the response. On the client, the plugin saves error details to pageStore.errorDetails and calls showError(), which replaces the entire SPA with error.vue.

The app is now broken. Some ref is null, some store is half-loaded, the component tree that threw is gone. error.vue doesn't care -- it uses no custom components, no stores, no script logic. Just a NuxtLink ("Report Error") and a plain anchor ("Reload Site"). Anything custom could trip over the same broken state that got us here.

"Reload Site" is a plain <a href="/"> -- no JavaScript, just a full page navigation that kills the SPA and starts fresh. "Report Error" navigates to /error2, a regular page (not a Nuxt convention) that attempts to use the broken SPA to report what happened. On mount, error2 takes the error details from the store into a local variable and immediately clears the store. This clearing matters: if the report itself throws, errorPlugin's guard (if pageStore.errorDetails) sees null, processes the new error normally, and sends the user back to error.vue. Without clearing first, the guard would block the second error.

Error2 auto-submits the report via a hidden Button (for Turnstile and Worker), then hard-replaces home. If the POST throws, errorPlugin catches it and the user lands on error.vue again. If there's nothing to report (direct navigation or drag-refresh), it bounces home immediately.

This is never an infinite loop. The only path to error2 is the user's click on error.vue. That manual click is the circuit breaker.

We follow Nuxt's intended error patterns -- hooks, showError(), error.vue -- but we don't use all of them. We don't use createError() -- our errors originate as toss() or natural exceptions. We don't use clearError() -- we exit error state with a full page navigation that has zero dependence on Nuxt cleaning up correctly. We don't use NuxtErrorBoundary -- try-catch-classify-rethrow is more precise. We don't use useError() or useFetch/useAsyncData error refs -- our data fetching goes through Worker and Pinia stores.
*/

</script>
<template>
<div class="page-container text-center space-y-2">

<p>Something went wrong. Sorry about that.</p>

<p><NuxtLink to="/error2" class="my-button ready">Report Error</NuxtLink></p>

<p><a href="/" class="my-button ready">Reload Site</a></p>
<!-- a href slash is the same as window.location.replace('/') but with no JavaScript; full navigation and spa reset same as if the user clicked Reload in the browser toolbar -->

</div>
</template>
