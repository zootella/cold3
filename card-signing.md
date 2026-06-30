# card signing — NUXT_OG_IMAGE_SECRET

nuxt-og-image HMAC-signs every social-share card URL (`/_og/...`) with a secret. This is the note on what that secret is for and how we set it, so future-us isn't confused about why there's an og secret living outside the `Key()` system.

## what it helps (beyond silencing the dev warning)

The signature is the gate that stops arbitrary requests from driving our satori/WASM render pipeline. `middleware.js` renders a card on a CDN cache-miss, so without a valid signature anyone could hit `/_og/<arbitrary params>` and force renders. In production the og-image handler verifies the signature before rendering, and 403s if it doesn't match the current secret.

The reason the secret has to be **stable** is the failure mode we worked through:

- If we don't set one, nuxt-og-image auto-generates a secret that **changes every build**.
- A card URL signed by build A then fails verification (403) under build B's secret.
- Fresh page renders always work (they sign with the live secret). What breaks is the **cross-build long tail**: a URL already baked into a tweet / WhatsApp / Slack unfurl, fetched again after a deploy once its CDN cache has expired, 403s until that platform re-scrapes the page. Plus a brief window during the rolling deploy itself where old- and new-build instances run different secrets.
- A stable secret makes signatures valid across all builds and all Cloudflare instances, permanently — so previously-shared previews keep working through deploys.

(It also silences the `@nuxtjs/og-image` "auto-generated secret that changes every build" dev warning, but that's the small part.)

## where it lives

Plain env var `NUXT_OG_IMAGE_SECRET`. No `nuxt.config` change — og-image reads it from the env directly.

- **local dev / `pnpm preview`:** the `NUXT_OG_IMAGE_SECRET=` line in `site/.env`.
- **production:** a Cloudflare Worker secret on the `site4` worker.

Local and production are independent environments — each just needs *a* stable value (they don't have to match; reusing one is fine). **Set once and don't rotate** — changing it re-triggers the one-time transition where old card signatures 403 until pages re-render.

## commands

Generate the secret (64-char hex — same convention as the `auth.js` secret):

```
openssl rand -hex 32
```

(nuxt-og-image's own `npx nuxt-og-image generate-secret` works too.)

Save it to production with wrangler — run from the `site/` directory so it targets the `site4` worker via `site/wrangler.jsonc`; it prompts for the value, paste the one from `site/.env`:

```
pnpm -C site exec wrangler secret put NUXT_OG_IMAGE_SECRET
```

(Or set it in the Cloudflare dashboard: Workers & Pages → `site4` → Settings → Variables and Secrets → add secret `NUXT_OG_IMAGE_SECRET`.)

## why this one secret is outside the Key() system

Deliberate exception, not drift. og-image reads `NUXT_OG_IMAGE_SECRET` from the env at points that never pass through our `decryptKeys` — the `/_og/` verify handler and the page-head signing — so a request-time `Key()` lookup can't feed it. And it's low-sensitivity (anti-abuse on the render pipeline, not a credential), so it lives as a plain env var in the two places above rather than in the encrypted `.env.keys` store. Everything genuinely secret still goes through `Key()`; this is the one intentional exception, and it's documented here so it doesn't look like a key that got left lying around.
