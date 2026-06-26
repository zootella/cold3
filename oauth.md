
# OAuth

planning and testing notes for third-party oauth provider links (Google, Twitter, Discord, ...) as a credential type alongside Browser, Name, Password, TOTP, and Wallet.

## Design Conversation

hi claude, i think we should rethink how we use the credential table for the oauth flow

	user_tag   CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed a credential, like an address
	type_text  TEXT      NOT NULL,  -- credential type, like "Phone.", "Twitter.", "Ethereum.", "Totp.", "Password." or others
	event      BIGINT    NOT NULL,  -- 2 mentioned, 3 challenged, 4 validated, 1 removed

userTag we use, of course
type_text is "Oauth."
event we use, both 3 challenged before starting the oauth flow
and 4 validated when we get back a response that attests proof from auth.js getting proof from the provider

	f0_text    TEXT      NOT NULL,  -- normalized form of address or name, to match as unique
	f1_text    TEXT      NOT NULL,  -- formal form of address, to send messages
	f2_text    TEXT      NOT NULL,  -- page form of address, to show the user

if the result contains an email address, validate it, and store it the three forms here, i think

	k1_text    TEXT      NOT NULL,
	k2_text    TEXT      NOT NULL,
	k3_text    TEXT      NOT NULL,
	k4_text    TEXT      NOT NULL

and then here's how we should use the k1-4
k1 is the provider name, like "Discord."
what are other values common to valid oauth responses that we should pull out for these fields?
and then one of them will probably be the entire stringified response, so we have it here as well as datadog, to begin

---

claude responding:

**type_text = 'Oauth.'** — clean. existing `credential1` index `(hide, user_tag, row_tick)` still covers "all this user's oauth credentials" in one query. no schema change needed, just the usage convention.

**event 3 and 4** — both useful. i'd treat event-3 purely as audit trail ("user started a Discord flow at time T"), never as a lock. OauthProve1's existing-link guard already checks event-4, and the tab race is "safely no-op" — so event-3 never needs to block anything, which also means we never have to garbage-collect abandoned event-3 rows from users who bailed at the provider.

**f0/f1/f2 = email forms** — (updated after kevin's response) greedy fill: whenever the letter includes an email, write the three forms, regardless of whether the provider attested it verified or not. that keeps the insert logic simple — "if letter has email, write it" — and defers the trust decision to a separate future step.

semantic: email in an `Oauth.` row is **provider-reported, not validated**. taken with a grain of salt. UI that shows it should read "Discord reports this email" rather than "your verified email."

future promote step (not in this pass — covered by "email inheritance from verified providers" ttd below): server-side logic walks the `Oauth.` rows, decides per-provider whether to trust the verification attestation, and either writes corresponding `Email.` rows (inheriting the provider's trust) or kicks off challenge/response validation flows. could also be "we trust all providers on our short whitelist unconditionally" — that policy call gets made later.

re: your question about providers that return email without a verified flag — google and discord both include one (we just saw discord's `verified: true` in the smoke test, google includes `email_verified`). twitter conditionally returns email with elevated scope. i'm not 100% on every provider — some enterprise/minor providers might bare-email. but the greedy-fill policy makes this a non-issue at insert time, since we're not making any trust claim when we write.

**what else is worth extracting into k2/k3/k4:**

- **providerId** — yes, definitely. stable unique id used for dedupe and re-auth. → `k2`
- **handle / display name** — yes, for the panel ("linked as @zootella"). discord gives `username`+`global_name`, google `name`, twitter `screen_name`+`name`. we already do the best-effort pick across providers. → `k3`
- **profile image URL** — skip. avatars change; fetching fresh per render beats storing stale.

**stringified `{account, profile, user}` in k4** — yes, worth it. scope it to just the provider-returned slice from auth.js's signIn — drop `success`, `browserHash`, `expiration`, `action` (those are envelope/wrapper metadata, not provider data, and already live elsewhere). disk is cheap, datadog retention is ~7-30 days, permanent per-user copy is useful for: (a) later inspection ("what did Discord actually tell us last March?"), (b) re-parsing if we extract more fields later, (c) user-data export down the road. the smoke test Discord slice was ~1.3KB — well within safe row sizes. spot-check google and twitter sizes before committing.

**proposed mapping:**

| column | value |
|---|---|
| `type_text` | `'Oauth.'` |
| `event` | `3` on OauthProve1, `4` on OauthProve2 success, `1` on OauthRemove |
| `f0/f1/f2` | email in normalized/formal/display form — greedy fill whenever letter has email; treat as *provider-reported, not validated* |
| `k1` | provider (`'Discord.'`) |
| `k2` | providerId (stable unique id from provider) |
| `k3` | handle / display name (for panel) |
| `k4` | stringified `{account, profile, user}` — just the auth.js/provider slice |

**open for us to decide:**

- should the provider's `email_verified` flag get its own slot, or just live inside the k4 blob? matters for auditing "we trusted Discord's verified=true at the time we accepted the email" if the provider later shifts policy.
- event-3 row payload: just `{type='Oauth.', event=3, k1=provider}` or also stamp the envelope tag / start time? row_tick already gives creation time, so maybe nothing else.
- do we want to persist anything about failed OauthProve2 (user cancelled, Auth.js rejected)? could write an event-1 or a distinct event code as audit trail, or stay quiet (our current design).

## Open items

### providerId uniqueness across cold3 accounts

_ttd april._ credentialOauthSet writes a row keyed by (userTag, type) and doesn't check whether some other userTag already has this providerId for this type. So Alice could link her Google identity, Bob could sign up separately and also link that same Google identity — both cold3 accounts coexist, each claiming the same Google account.

we already have this guarantee for display names via credentialNameCheck. same guarantee here: one Google/Discord/Twitter identity, one cold3 account.

decision points:
- strict rejection (like name collision) — `task.outcome = 'OauthClaimedElsewhere.'`, UI shows "this Google account is already linked to a different cold3 account"
- or offer "sign into that existing account instead" as remediation — depends on sign-in-via-oauth, a separate flow we haven't designed yet
- where to check: inside credentialOauthSet before the insert, or in a standalone credentialOauthCheck that OauthProve1/OauthProve2 call explicitly (parallels credentialNameCheck)

### email inheritance from verified providers

_ttd april._ OAuth providers return email with varying trust signals. Google gives email plus `email_verified` (always true for @gmail.com, potentially false for workspace or custom domains). Discord gives email plus a `verified` flag. Twitter may or may not return email at all without elevated scope.

rather than making the user re-verify an email they've already proven to Google or Discord, we could accept the provider's verification as valid — write the email straight into credential_table as if it had been challenge/response verified.

what to decide:
- per-provider trust policy: Google's `email_verified` is trustworthy, others less so — whitelist providers whose flag we trust?
- dependency: email-as-credential type needs to exist first. today address_table is challenge-based; migrating into credential_table is a separate ttd march item
- conflict handling: user links Google with email alice@x.com, later challenge-verifies alice@y.com — keep both? replace?

### tab race on link (chaos user)

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

### route back to origin after OauthProve2

_ttd april._ task.route is hardcoded to '/page1' where CredentialPanel renders — fine today because linking always starts from CredentialPanel. will break when oauth becomes a sign-in or sign-up path: user clicks Continue with Google on the sign-in form, completes the flow, expects to land back at whatever they were doing before signing in, not on /page1.

we deliberately avoided passing the start URL through the envelope — the envelope already carries account/profile/user payloads from the provider, nesting a URL makes them unwieldy (encoding, length).

alternatives to consider:
- short intent tag in the envelope: `'signin' | 'link' | 'signup'` — server maps the tag to a route
- browser-side: stash start URL in a cookie or sessionStorage before redirecting to oauth.cold3.cc, read it back in oauth2.vue
- hybrid: intent tag in envelope for the common case, query param on oauth2.vue return for cases that need it

### naming cleanup for OauthStart / OauthContinue / OauthDone (done)

triple-use of `Oauth*` across three overlapping namespaces resolved with these renames:

- nuxt worker POST actions: `OauthProve1.`, `OauthProve2.`, `OauthRemove.` (was `OauthStart.`, `OauthDone.`, `OauthRemove.`) — numbered-suffix convention matches `TotpEnroll1./2.` and `WalletProve1./2.`
- envelope tags: `OauthEnvelopeContinue.`, `OauthEnvelopeDone.` (was `OauthContinue.`, `OauthDone.`) — `OauthEnvelope` prefix gives them their own namespace
- outcomes: `OauthContinue.`, `OauthAlreadyLinked.` (was also `OauthProven.`, `OauthBad.` — those were dead code in the deleted oauth.js demo flow, set but never read)

both collisions are resolved: `OauthDone.` no longer lives in two namespaces, and `OauthContinue.` is now only an outcome string. store function `oauthStart` renamed to `oauthProve1` to match the new action name.

### provider letter URL size audit

Auth.js composes a redirect URL at signIn() time carrying the full sealed envelope (account, profile, user from the provider). we already log `url.length` on every signIn, so Datadog has real data from Google, Discord, Twitter across whatever user varieties have signed in so far. Cloudflare's URL length limit is 16,000 characters — confirm we're comfortably under across providers and profile varieties.

what to look for in Datadog:
- p99 url.length per provider
- outliers from users with unusually long display names, bios, or picture URLs
- anything over ~12,000 (safety margin)

if we're close to the limit, the fix is to stop passing the whole letter through the URL — store server-side keyed by a short token, pass just the token.

### Auth.js $env pattern

_ttd january._ today oauth/src/auth.js reads secrets via icarus' decryptKeys using tracer `a10` (built into the server bundle at build time) and `a20` (Cloudflare runtime env). works, but relies on import-graph analysis to keep secrets out of the client bundle — auth.js is only imported from hooks.server.js, which SvelteKit knows is server-only.

switching to SvelteKit's `$env/static/private` and `$env/dynamic/private` (adding tracers `a30`/`a40`) would add a build-time guardrail: if anyone accidentally imports auth.js from a `.svelte` component, SvelteKit errors at build time rather than silently bundling secrets into the client code. icarus decryptKeys accepts plain objects either way, so it's a drop-in.

alongside: use xray.js to confirm the tracer locations actually fire where we expect in each environment (local vs cloud). we wrote a10/a20/a30/a40 based on docs without verifying in practice.

### function-in-template works in Vue

_ttd december2025._ OauthPanel's template calls `linkState(provider.name)` directly in a `:state=` binding. it works — the button state updates reactively when `refClickedProvider` changes. surprising because Vue docs typically steer toward computed properties for template logic, warning that functions rerun on every render.

to confirm:
- that the function actually only reruns when the refs it touches change, not on every unrelated component re-render
- or, that it's fine either way because linkState reads one ref and is cheap
- if the pattern is safe, document it as accepted style; if not, convert to computed and standardize

low-stakes — just Vue trivia worth confirming before we propagate the pattern.

## Vestigial code to delete once OauthPanel is stable (done)

`site/app/components/snippet1/OauthDemo.vue` — deleted; OauthPanel.vue replaces it inside CredentialPanel
`site/server/api/oauth.js` — deleted; `/credential` actions OauthProve1/OauthProve2/OauthRemove handle what oauth.js did, and write the credential_table row on success
