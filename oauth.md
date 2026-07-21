
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

the same relationship can flow in the opposite direction: a user enters the add-email flow and types a @gmail.com address — instead of the normal otp challenge, detour them through the Google oauth flow. when they come back we've validated two credentials at once, the email and the google account link, with no code typed and no trip to the inbox. not necessarily simpler (the oauth dance has its own weight), but one flow yielding two credentials. the detour only works when the address's domain names its provider — @gmail.com does; a workspace domain hosted on google doesn't reveal itself — so otp stays the general path and this is an optimization for the recognizable case. one wrinkle to design for: the user typed alice@gmail.com but might complete the flow signed into google as bob@gmail.com, so the address we'd verify is the one the provider returns, not necessarily the one they typed. and the detour lands on the machinery above — it ends by writing the email credential from the provider's verified flag — so the forward direction depends on the inheritance decisions either way.

the two directions are the same idea — proof of one credential type carrying over to another — and are filed together here deliberately. both stay deferred for now: the current work builds credential types secure and correct side by side in the unified stack, and cross-type relationships between them are their own later piece of design.

### tab race on link (concerns chaos user)

uncommon but not impossible: two tabs open on the credential panel, user links a provider in tab A, tab B (stale view, still shows the provider as unlinked) clicks Continue with the same provider. since svelteless this race lands in one place:

- credentialOauthSet catches it at the DB layer, inside the signIn callback — check 1 sees this user already has the provider linked, returns `OauthAlreadyLinked.`, writes nothing

design: **safely no-op, land back on a fresh panel, no custom UI copy**. this is a chaos-user corner; custom messaging adds work and test surface for someone who probably isn't reading. the flow's redirect reloads the page, the store loads fresh state, the panel renders true linked state, user can try again.

same treatment for user-cancelled-at-provider: Auth.js hands the cancel back as an ?error= redirect, the governance block sorts it as not-ours-to-fix, and the user lands on the panel with the one-shot `?oauth-done=Cancelled` nudge described above, state unchanged.

smoke test to confirm the corner is safe end-to-end:
- open two tabs on /page1
- link Discord in tab A, confirm tab A shows linked
- in tab B (still showing Discord unlinked), click Continue with Discord
- confirm no blow-up; tab B's panel refreshes to show Discord linked
- also confirm: cancel at the Google page — user lands back at /page1 with no change and no error

### route back to origin after the callback (concerns larger sign-up and sign-in flows)

_ttd april._ the flow's final redirect is hardcoded to '/page1' where CredentialPanel renders (the signIn callback returns it) — fine today because linking always starts from CredentialPanel. will break when oauth becomes a sign-in or sign-up path: user clicks Continue with Google on the sign-in form, completes the flow, expects to land back at whatever they were doing before signing in, not on /page1.

we deliberately avoided passing the start URL through the envelope — the envelope already carries account/profile/user payloads from the provider, nesting a URL makes them unwieldy (encoding, length).

alternatives to consider:
- short intent tag in the envelope: `'signin' | 'link' | 'signup'` — server maps the tag to a route
- browser-side: stash start URL in a cookie or sessionStorage before the form POST starts the flow, read it back when the callback's redirect lands
- hybrid: intent tag in envelope for the common case, query param on the return redirect for cases that need it

