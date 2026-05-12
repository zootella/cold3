# storage

A plan to retire the two envelope cookies (OTP and TOTP) and replace them with a single user-keyed localStorage entry that holds an encrypted credential envelope plus a plain-text expiration sidecar.

## [1] why move off cookies

The OTP and TOTP envelopes today are encrypted blobs the server seals, the page parks in a cookie, and the page reads back and posts in the body of a later request. The cookie is sealed (only the server can read its contents), so the cookie's transport semantics — being attached to every outgoing same-origin request — aren't doing useful work. They're a leftover from the cookie storage decision, not a feature of the design.

Three concrete reasons the cookie storage is the wrong fit.

First, the ciphertext rides on every same-origin request even though the server never reads it from a header. With `httpOnly: false`, `sameSite: 'Strict'`, `path: '/'` (see `icarus/level2.js:372-379`), the envelope is in every `Cookie:` header to our origin. That's wasted bytes and a latent footgun — nothing prevents a future handler from reading the header and treating it as ambient state. localStorage closes that door entirely.

Second, the 4KB-per-cookie limit constrains future growth. Today's two envelopes stay small, but unifying them means combining slices for OTP, TOTP, wallet challenges, and OAuth handoffs into one letter. localStorage's 5-10MB origin quota removes the constraint.

Third, two cookies means two parallel flows. `OtpEnterList.vue` reads `useOtpCookie()` and calls `FoundEnvelope.`; `credentialStore.load()` reads `useTotpCookie()` and rides on `Get.`. With one envelope per user, there's one storage entry, one set of helpers, and one round trip that can recover all in-flight state on first paint.

## [2] what we keep from the cookie design

The encryption model is unchanged. `sealEnvelope`/`openEnvelope` (`icarus/level2.js:394`, `:405`) keep working exactly as they do today — the server is the only reader, the action string scopes the envelope to its purpose, browserHash binding prevents transplant, the internal `letter.expiration` rejects stale envelopes server-side. None of that depends on where the page parked the ciphertext between requests.

The flow is also unchanged. The page sends the envelope in the body of a relevant request. The server opens, mutates the letter, re-seals, returns the new envelope. The page replaces what it had. The only difference is which browser API holds it between requests.

## [3] what changes

A single localStorage entry per user, keyed by userTag, holds a JSON object with two properties: the encrypted ciphertext and a plain-text expiration timestamp. The credentialStore exposes `getEnvelope(userTag)` and `setEnvelope(userTag, envelope)` as the only API. Components call these directly when constructing fetch bodies and handling responses; they never touch localStorage themselves.

The unified envelope's internal letter has typed slices — an OTP slice (today's `letter.otps` array, the rolling list of live challenges) and a TOTP slice (today's `EnrollTotpEnvelope.` shape, the in-flight enrollment secret and binding message). Future slices for wallet-prove and oauth-handoff can join the same letter. The server merges inputs on each request, re-seals the whole letter, returns it.

The action string changes from the current per-flow strings (`'Otp.'`, `'EnrollTotpEnvelope.'`, etc.) to a single unifying action — call it `'CredentialEnvelope.'` for now. This is a one-time invalidation: envelopes sealed under old action strings won't open under the new one. With a 20-minute max lifetime, this resolves itself by deploying and waiting.

## [4] why per-user keying

Two real people can share a browser profile on the same device. User A signs in, starts TOTP enrollment, signs out before finishing. User B signs in, runs her own flow, signs out. User A signs back in, expects to resume where he was. Per-browser storage tangles their state; per-user storage keeps them separate.

We commit to assigning a userTag early — even before authentication completes, sign-up creates a userTag for the in-flight person. Call this *Option D* from the design conversation: there's always a userTag to scope to, including for pre-authentication OTP flows. The specifics of how and when the early userTag is minted are deferred; the storage layer just requires that the calling code can pass one.

A consequence: abandoned entries for *other* userTags linger in localStorage until something prompts contact with the server about that userTag (at which point the server says `Expired.` or `task.envelope = null` and the page deletes the entry). Bounded by the number of users who've shared this browser profile, so likely fine. Without a plaintext expiration on the page, a fully-local sweep can't tell stale from fresh — any sweep would have to round-trip through the server. Probably not worth building unless a real problem surfaces.

## [5] expiration is server-side only

The envelope's ciphertext has its expiration baked in (`letter.expiration`, written by `sealEnvelope` at `level2.js:399`). Only the server can read it; only the server enforces it. The page never inspects expiration locally — it sends whatever envelope it has, and trusts the server's response to tell it what to keep.

This trades a tiny cost for a meaningful simplification. If the page holds a stale envelope, it sends it; the server detects expiration (the existing manual `isExpired` checks in flows that use `skipExpirationCheck` at `credential.js:172, 249` already handle this); the response either returns a graceful `Expired.` outcome or sets `task.envelope = null` to signal "clear it"; the page deletes the stored entry on the response.

The cost is one round trip's worth of bytes for a stale envelope — typically the same round trip the page was making anyway, since envelope-relevant flows fire whether the stored value is fresh or stale. The gain is that the page has nothing to track. Expiration lives in exactly one place: encrypted inside the envelope, where the server already enforces it.

Every server response from an envelope-relevant action carries a fresh truth. If the server processed something, it re-seals the letter (with `Now() + duration` baked in fresh by `sealEnvelope`) and returns the new ciphertext. If the server wants no logical change, it re-seals the existing letter unchanged — the page replaces what it had, and the expiration rolls forward as a side effect of re-sealing. If the server wants the envelope cleared, it returns `task.envelope = null`. Actions that have nothing to do with envelopes return `task.envelope === undefined`, and the page leaves storage alone.

## [6] key and value format

```
key:    cold3:credential-envelope:<userTag>
value:  '{"envelope":"<ciphertext>"}'
```

The `cold3:` prefix reserves a namespace and makes the entry obvious in devtools. The `credential-envelope:` segment leaves room for future kinds of envelope storage (`cold3:browser-envelope:`, etc.) without collisions. The userTag is the per-user discriminator.

The value is a JSON object with one property today, `envelope`, the base62 ciphertext from `sealEnvelope`. The server is the only party that can open it; the page treats it as opaque.

Use `makeText` to serialize and `makeObject` to deserialize. `makeText` (`icarus/core.js:2752`) is JSON.stringify with BigInt and circular-reference handling. `makeObject` (`icarus/core.js:2751`) is `JSON.parse`. The JSON wrapper is mild overhead for a single-field object today, but reserves room for future fields (schema version, browserHash binding outside the envelope, audit metadata) without a parse-rule migration.

## [7] the credentialStore additions

```js
const envelopeStorageKey = userTag => `cold3:credential-envelope:${userTag}`

function getEnvelope(userTag) {//returns ciphertext string, or null if absent; server decides freshness on receipt
	if (!import.meta.client) return null
	let raw = localStorage.getItem(envelopeStorageKey(userTag))
	if (!raw) return null
	try {
		return makeObject(raw).envelope
	} catch {//malformed entry from an older version or partial write; drop it
		localStorage.removeItem(envelopeStorageKey(userTag))
		return null
	}
}

function setEnvelope(userTag, envelope) {//pass null or empty to clear; otherwise replaces the stored ciphertext
	if (!import.meta.client) return
	if (hasText(envelope)) {
		localStorage.setItem(envelopeStorageKey(userTag), makeText({envelope}))
	} else {
		localStorage.removeItem(envelopeStorageKey(userTag))
	}
}
```

Add `getEnvelope, setEnvelope` to the store's `return {...}`. There's no reactive ref, no `mounted()` action, no watcher — synchronous localStorage reads are fast enough that components call `getEnvelope` fresh each time they need it.

Removed when this lands: `useOtpCookie()` and `useTotpCookie()` in `site/app/composables/icarusComposable.js:68-69`, and the `'temporary_envelope_otp'` and `'temporary_envelope_totp'` cookie names with them.

## [8] usage from components

Constructing a fetch body:

```js
let body = {envelope: credentialStore.getEnvelope(userTag), ...otherFields}
let task = await fetchWorker('/credential', 'Get.', body)
```

Handling the response:

```js
if (task.envelope !== undefined) credentialStore.setEnvelope(userTag, task.envelope)
```

The server may return `task.envelope = null` to signal "clear it" (envelope expired server-side, user signed out, enrollment completed). The page treats null as "remove from storage." `task.envelope === undefined` means "the server didn't touch the envelope in this response" — the page leaves storage alone.

(hi claude, let's talk about this. i realiez now we could simplify to have the expiration only in the envelope, and have every response set the local envelope. so if the server wants no change to the envelope, they send back the same envelope. and if there's a really stale envelope in local storage, it'll get deleted only on contact wtih the server--we really don' tneed to worry about th epage noticing stale before sending ,it's fine for the server to)

## [9] accepted tradeoff: SSR flash on enrollment-recovery refresh

Today, `credentialStore.load()` reads `useTotpCookie()` during the SSR render and sends it as `body.envelope`. The server opens it and returns `task.enrollment` so the TOTP panel renders in-progress state on first paint.

After the migration, the SSR pass can't see localStorage. The server gets no envelope, returns no enrollment, and `TotpPanel.vue` renders the collapsed default state. After mount on the client, the panel calls back to the server with the envelope from localStorage and flips to in-progress state. That's a visible flash on the rare case of a mid-enrollment refresh.

This is accepted. The alternative — wrapping the recovery UI in `<ClientOnly>` so SSR renders neither state — adds layout shift and isn't clearly better. Mid-enrollment refresh is uncommon; a brief flip is acceptable UX.

## [10] open questions

**When does the userTag get minted for a pre-authentication person?** Option D commits to "early" — likely on first hit of the OTP flow, or on a dedicated pre-sign-up step. The exact moment, and where the userTag lives between then and full authentication, is deferred. The storage layer's only requirement is that calling code has a userTag by the time it calls `getEnvelope` or `setEnvelope`.

**Should there be a periodic sweep of expired or other-userTag entries?** Not for now. The current design only cleans the userTag that's being asked about. If a single browser profile collects entries for many users over time, the count is bounded by the number of unique signers. A future `clientLoad`-style action could iterate `localStorage`, parse anything under the `cold3:credential-envelope:` prefix, and drop expired ones. Add if and when it matters.

**Do we want cross-tab `storage` event handling?** With per-user keying, two tabs both signed in as user A would see each other's envelope updates. That's automatic — VueUse or hand-rolled, the `storage` event fires in the *other* tab when one writes. We're not subscribing to it today; if a real flow benefits from cross-tab reactivity, add a listener later.
