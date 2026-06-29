
# OAuth

planning and testing notes for third-party oauth provider links (Google, Twitter, Discord, ...) as a credential type alongside Browser, Name, Password, TOTP, and Wallet.

## Surfacing flow outcomes to the page (the `?oauth-done` hint)

Since svelteless the flow runs entirely in the apex worker and ends with a server-issued redirect back to the credential panel. That redirect is the only channel from the trusted callback to the page: the flow is a browser navigation (form POST → provider → callback → redirect), not a `fetchWorker` call, so the universal `task.outcome` pattern the other credentials use — page makes the call, reads the result back — isn't available. The page isn't in the loop when the outcome is known.

A flow ends one of four ways, and only one of them is a permanent fact:

- **success** — the user proved control of a provider account they hadn't linked. `credentialOauthSet` writes the `event 4` proof row, and the panel shows "linked as X" from that row on its next `Get`. A fact in the database, read like any other credential — no hint needed, correct whether the flow finished a moment or a month ago.
- **already linked, same account** — only reachable via a stale panel (a second tab, or a bfcache-restored page, still showing the button after another tab linked). Rare and accidental. Silent no-op: nothing is written, and the user lands on a fresh panel that simply shows the provider linked.
- **claimed elsewhere** — the user genuinely proved control, but another cold3 user already holds that provider identity (one identity, one account), so we decline and write nothing. They're owed an explanation.
- **cancelled at the provider** — they backed out at the provider's screen, often startled it appeared at all, maybe in the wrong browser profile. No proof. They're owed a nudge to try again.

The two that owe the user a word — claimed-elsewhere and cancelled — produce no credential row, so there's nothing for the panel to read from state. We carry them back as a one-shot query-string hint: `/page1?oauth-done=ClaimedElsewhere` (set in the `signIn` callback's return) and `/page1?oauth-done=Cancelled` (set in the governance block after `Auth()`). `OauthPanel` reads `?oauth-done` once at setup, maps the known key to fixed copy, renders it above the provider list, and strips the param from the URL on mount.

**Why a readable query param, and not the alternatives.** We circled every existing transport before landing here. The universal `task.outcome` channel needs the page to have made the call — it didn't. A sealed envelope in a cookie (the TOTP-recovery pattern) would be our first endpoint-set cookie, and it cuts against storage.md's plan to move envelopes off cookies entirely. The localStorage future in storage.md is page-only — the server can't write it, and the page isn't present at the callback to write it, so it's structurally impossible for a redirect. Recording the outcomes as database rows would splay out new credential-row types (declined, claimed-elsewhere, ...) for results that aren't credentials and aren't timeless facts. And a sealed envelope in the query string is the cross-origin handoff machinery svelteless just deleted — an opaque blob in the route that survives reload/share and needs a page to post it back.

**Why the route is the right home for this one thing.** The rule against putting state results in routes guards against *load-bearing* state — anything the server or page trusts to make a decision, grant access, or write to the database. The old `OauthEnvelopeDone` was exactly that: it carried the proof the server wrote to the table, which is why it was sealed. `?oauth-done=Cancelled` is the opposite — a disposable display hint no one trusts. No server reads it; nothing is written from it; the page uses it only to pick which fixed sentence to show, and a tampered value just shows the user a different harmless sentence. So it lives safely in the route, and for the same reason it is deliberately *not* sealed: encryption here would be ceremony at a non-boundary.

**Guardrails.** Because the value is user-visible and tamperable, the panel maps known outcome keys to fixed copy and renders nothing for anything else — it never echoes the raw param, which would be an XSS hole. It captures the value once for first paint, then `history.replaceState`s it off the URL so a reload, a back button, or a shared link doesn't replay the message.

The collision and cancel outcomes are still recorded for the team in Datadog via `logAudit` ("oauth done" carries `outcome`, "oauth sad path" carries `errorType`) — that's where the funnel lives, paired with the `event 3` challenge row that marks "we sent this user in." The query-string hint is only the user-facing word; nothing transient lands in the database. This is the first place we pass an outcome through the route this way; if another server-driven redirect ever needs to tell the page something, it's the precedent.

## Open items

### email inheritance from verified providers (concerns interaction between oauth and email credentials)

_ttd april._ OAuth providers return email with varying trust signals. Google gives email plus `email_verified` (always true for @gmail.com, potentially false for workspace or custom domains). Discord gives email plus a `verified` flag. Twitter may or may not return email at all without elevated scope.

rather than making the user re-verify an email they've already proven to Google or Discord, we could accept the provider's verification as valid — write the email straight into credential_table as if it had been challenge/response verified.

what to decide:
- per-provider trust policy: Google's `email_verified` is trustworthy, others less so — whitelist providers whose flag we trust?
- dependency: email-as-credential type needs to exist first. today address_table is challenge-based; migrating into credential_table is a separate ttd march item
- conflict handling: user links Google with email alice@x.com, later challenge-verifies alice@y.com — keep both? replace?

### tab race on link (concerns chaos user)

uncommon but not impossible: two tabs open on the credential panel, user links a provider in tab A, tab B (stale view, still shows the provider as unlinked) clicks Continue with the same provider. two places this race lands:

- OauthProve1 catches it before the cross-origin redirect — server returns no envelope, outcome `OauthAlreadyLinked.`
- credentialOauthSet catches it at the DB layer when both tabs cleared the start check — OauthProve2 sets outcome `OauthAlreadyLinked.`, writes nothing

design: **safely no-op, refresh panel state, no custom UI copy**. this is a chaos-user corner; custom messaging adds work and test surface for someone who probably isn't reading. the button resets, credentialStore's apply(task) picks up the server's fresh attachState response, the panel re-renders to show true linked state, user can try again.

same treatment for user-cancelled-at-provider (`letter.success === false` in OauthProve2): no-op, task.route navigates the user back to the panel via a page reload that re-runs the store load, state unchanged.

smoke test to confirm the corner is safe end-to-end:
- open two tabs on /page1
- link Discord in tab A, confirm tab A shows linked
- in tab B (still showing Discord unlinked), click Continue with Discord
- confirm no blow-up; tab B's panel refreshes to show Discord linked
- also confirm: cancel at the Google page — user lands back at /page1 with no change and no error

### route back to origin after OauthProve2 (concerns larger sign-up and sign-in flows)

_ttd april._ task.route is hardcoded to '/page1' where CredentialPanel renders — fine today because linking always starts from CredentialPanel. will break when oauth becomes a sign-in or sign-up path: user clicks Continue with Google on the sign-in form, completes the flow, expects to land back at whatever they were doing before signing in, not on /page1.

we deliberately avoided passing the start URL through the envelope — the envelope already carries account/profile/user payloads from the provider, nesting a URL makes them unwieldy (encoding, length).

alternatives to consider:
- short intent tag in the envelope: `'signin' | 'link' | 'signup'` — server maps the tag to a route
- browser-side: stash start URL in a cookie or sessionStorage before redirecting to oauth.cold3.cc, read it back in oauth2.vue
- hybrid: intent tag in envelope for the common case, query param on oauth2.vue return for cases that need it

### provider letter URL size audit (concerns sveltekit)

Auth.js composes a redirect URL at signIn() time carrying the full sealed envelope (account, profile, user from the provider). we already log `url.length` on every signIn, so Datadog has real data from Google, Discord, Twitter across whatever user varieties have signed in so far. Cloudflare's URL length limit is 16,000 characters — confirm we're comfortably under across providers and profile varieties.

what to look for in Datadog:
- p99 url.length per provider
- outliers from users with unusually long display names, bios, or picture URLs
- anything over ~12,000 (safety margin)

if we're close to the limit, the fix is to stop passing the whole letter through the URL — store server-side keyed by a short token, pass just the token.

### Auth.js $env pattern (concerns sveltekit)

_ttd january._ today oauth/src/auth.js reads secrets via icarus' decryptKeys using tracer `a10` (built into the server bundle at build time) and `a20` (Cloudflare runtime env). works, but relies on import-graph analysis to keep secrets out of the client bundle — auth.js is only imported from hooks.server.js, which SvelteKit knows is server-only.

switching to SvelteKit's `$env/static/private` and `$env/dynamic/private` (adding tracers `a30`/`a40`) would add a build-time guardrail: if anyone accidentally imports auth.js from a `.svelte` component, SvelteKit errors at build time rather than silently bundling secrets into the client code. icarus decryptKeys accepts plain objects either way, so it's a drop-in.

alongside: use xray.js to confirm the tracer locations actually fire where we expect in each environment (local vs cloud). we wrote a10/a20/a30/a40 based on docs without verifying in practice.
