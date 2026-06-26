
# OAuth

planning and testing notes for third-party oauth provider links (Google, Twitter, Discord, ...) as a credential type alongside Browser, Name, Password, TOTP, and Wallet.

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
