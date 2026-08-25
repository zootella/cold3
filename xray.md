# xray

How we manage and secure secrets: the key system that seals them into every bundle, the tracers that make them searchable by design, the exact picture of where they may and may not appear — bundles, provider systems, and the build pipelines in between — and the xray tool that independently confirms, by search, that the picture holds.

## The key system: secrets sealed into the wrapper

Application keys live in one local file, .env.keys, which is gitignored and never leaves the workstation in plain form. At seal time, seal.js splits its lines by their tags: a key tagged public is encoded into `wrapper.publicKeys` — necessarily and intentionally public, factory presets and client-side values — and every other key is encrypted with AES-256-GCM into `wrapper.secretKeys`. Both strings ride inside wrapper.js, which ships in every bundle: the lambda, the worker, and the browser page all carry the ciphertext. What separates servers from pages is possession of the one symmetric decrypting key, K10 — ACCESS_K10_SECRET where code reads it — kept in each provider's secrets service and in workstation .env files, and mapped with its one build echo below. A page holds the sealed string as dead weight it cannot open; a server opens it at the door, and from then on Key() answers by name. Two details are easy to miss: every decrypted value is registered for redaction, so secrets that wander toward a log line are blacked out before writing; and because .env.keys is hashed into wrapper.txt like any other file, a changed key value produces a new wrapper hash — the running version is cryptographic evidence of exactly which secrets it holds, and drift between code and keys is structurally impossible.

Sealing the application's many secrets into the wrapper, rather than filing each one separately into the Amazon and Cloudflare secrets managers, is a deliberate trade. Two dashboards mean two places to update, two sets of rules about key counts and value lengths, and real failure modes we hit early: a deploy relying on a new key while the manager still held the old one, or values drifting between platforms, or between local and deployed. A varied, complex system that looks more secure can be less secure, because mistakes become easier than attacks. So the providers' secrets services hold exactly one value each — K10, which never changes version to version — while each sealed version carries an unconstrained number of secrets whose integrity the wrapper hash proves.

## The tool

Independent confirmation, by search, that secret values are only in the places they should be — through the whole build pipeline, and in the bundles delivered to the cloud providers. The frameworks between our code and the deployed artifacts are complex, many-staged, and not ours: nuxt, nitro, rollup, and esbuild each transform, split, inline, and copy through their own intermediate locations on disk. Rather than trusting our reading of their documentation, xray checks the outputs themselves. The tool is xray.js at the monorepo root: a thin wrapper around ripgrep run as `rg -uuu`, which disables every default filter — gitignored files, hidden files, binary files — so the search really covers everything a pipeline wrote, not just what a polite search would look at. Run it like `pnpm xray FujiTracerX10`, giving the text to find; it prints a census of paths and per-file counts, never the contents around a hit, and the operator matches that census against the expectations this document records — by hand, deliberately, because a person should be thinking when the subject is secrets. The X family in that example is reserved for documentation, explained with the tracers below. One reach the search doesn't have: compressed archives, like the lambda zip, whose contents must be streamed through the search separately — the tool prints the recipe.

## The tracers: secrets searchable by design

The search works because the sealed values are built to be findable. Every value the Key() system produces wears a tracer prefix: the word FujiTracer, a letter and number code, then an underscore dividing prefix from payload. The family has three members, spelled throughout this essay in the same broken form the code uses, because a document in the repository must never be a false positive. `'FujiTracer'+'K10_'` is K10 itself, ACCESS_K10_SECRET — the one symmetric secret that separates servers from pages. `'FujiTracer'+'S10_'` is wrapper.secretKeys — the whole secret block of .env.keys, encrypted with AES-256-GCM under K10. `'FujiTracer'+'P10_'` is wrapper.publicKeys — the public block, factory presets and client-side values, intentionally and necessarily public but politely obscured. Behind each prefix the payload is base62, cut into random ten-to-twenty character words so the long value wraps nicely in graphical editors; the prefix itself stays contiguous, so it's the search term. And individual values inside .env.keys can wear family codes of their own — the envelope secret wears `'FujiTracer'+'E10_'` — so a single secret can be hunted by its own marker the same way, and a hit on one outside .env.keys is that specific secret leaking.

The detail that makes the search trustworthy: nowhere in source code — or in this essay — does an assembled real tracer string exist. seal.js builds the prefixes by concatenation, exactly as spelled above, so the only places a real family's assembled string ever appears are genuine sealed values. A search for the assembled S10 marker finds real payloads and nothing else: no false positives from the code that constructs them, no hand-listing of assembly sites to exclude. Grep for the marker, and every hit is the real thing.

One code is reserved so documentation can show the anatomy whole: X — the x in xray, the 555 of this system — never real. Because no X value exists, writing it assembled costs nothing, and here is the complete picture in one place. The code assembles a prefix like `'FujiTracer'+'X10_'`; the finished head reads `FujiTracerX10_` with the word-wrapped base62 payload following; and a search names it whole, like `pnpm xray FujiTracerX10`. We'll likely never actually search for X — and if we did, the census would answer with the notes and documentation about xray itself, which is exactly what it should say.

## The three bundles

cold3 delivers three bundles to two cloud providers. The AWS lambda bundle is exclusively a server bundle. The nuxt build for Cloudflare workers produces two: a client bundle, delivered to and revealed in public browsers, and a server bundle, which stays secret and untampered on Cloudflare's servers.

The wrapper ships in all three, so the expected picture is precise. The P10 tracer appears in every bundle — the public keys are meant to be everywhere. The S10 tracer also appears in every bundle, including the client: a page holds the ciphertext as dead weight it cannot open, since possession of K10 is what separates servers from pages, and encryption rather than delivery is what protects the secret block. What must appear in no bundle at all — client or server, delivered anywhere — is the K10 tracer and every decrypted plaintext value. The client bundle is the sharpest edge: everything in it is public by definition, so a single stray hit there is a leak, full stop.

## The third place secrets live

Beyond the workstation and the bundles there is a third category of location: services in the providers' infrastructure that server code can reach at runtime but that are never part of any delivered bundle. On both providers, K10 is set by hand into the secrets service, so no build or deploy script ever builds or delivers it. On Cloudflare this is Workers secrets — encrypted variables bound to the worker with `wrangler secret put`, write-only after they're set, delivered to the worker as environment bindings, untouched by deploys. On AWS it is Secrets Manager (of AWS's several such services — Lambda environment variables, Secrets Manager, Systems Manager Parameter Store — the one that's both encrypted at source and usable here): the secret cold3/k10 holds the whole prefixed value, and CloudFormation fills the lambda's environment from it during each stack update, so the running lambda still reads ordinary process env while the deploy pipeline carries only a reference. And on the workstation, the local .env files, gitignored and never leaving the machine in plain form.

These are exactly where K10 is kept — Workers secrets, Secrets Manager, and the workstation .env files — each set by hand through the provider's own tooling. The deploy machinery makes one working copy in transit, the dist echo of .env, which the pipeline section below maps. What xray contributes is telling those deliberate places and the one documented echo apart from a leak: proving K10 appears nowhere the plan doesn't name.

### Setting K10 by hand

Both providers take the value once, by hand, with the things to look for and click in bold. On Cloudflare: `wrangler secret put` names the variable and prompts for the value, or the dashboard's worker settings page takes the paste. On AWS, in the console: with the region set to **N. Virginia (us-east-1)** beside the stack, search for **Secrets Manager** and click **Store a new secret**. Of the six secret types, choose **Other type of secret**; below it, switch from Key/value to the **Plaintext** tab, delete the prefilled empty braces, and paste the whole prefixed value verbatim — no quotes, no trailing newline. Leave the encryption key on the default the console describes as the KMS key Secrets Manager creates (a customer-managed key would add a second permission gate we get nothing from, our deploy identity being an administrator). Click **Next**, set Secret name to **cold3/k10**, skip tags, resource permissions, and replication, click **Next**, leave automatic rotation off — our rotation story is the K numbering itself, and nothing in the service nags about it — click **Next**, review, and click **Store**.

The CLI verifies without ever fetching the value: `aws secretsmanager describe-secret --secret-id cold3/k10 --region us-east-1` shows the secret's metadata and its one version staged AWSCURRENT. No settings-changing CLI step is part of the setup; if one ever becomes necessary, it gets recorded here the same way. The permissions are already in place structurally: the deploy identity needs secretsmanager GetSecretValue (ours is an administrator), the lambda's execution role needs nothing, because the function only ever sees a plain environment variable, and rotation to a new K number means storing the next value beside this one and never deleting a secret a stack still references.

## The pipelines on disk

The picture of what actually happens during a build and deploy: which files get read, written to another location, and mutated further. Two sources agree here — the documented behavior of the frameworks and providers, and direct observation of the artifacts the last builds left on this workstation's disk (August 2026). Where the essay says observed, a search of the real files confirmed it; where it says documented, the frameworks' own documentation states it. This section stands alone as a picture of the pipeline, and it is the foundation the tracer expectations rest on.

### The lambda pipeline

`pnpm cloud` in net23 runs build.js and then `serverless deploy` from inside the freshly built dist.

build.js empties and rebuilds `net23/dist/` by hand: it copies `.env` to `dist/.env`, copies `src/` and `persephone/`, and writes a transformed `dist/serverless.yml` — the BuildRemove-marked lines stripped (those exist so serverless-offline can emulate API Gateway locally; deployed, the lambdas use Function URLs), and K10's line swapped by a one-line literal replace, `${env:ACCESS_K10_SECRET}` becoming the quoted Secrets Manager dynamic reference. It synthesizes `dist/package.json` by merging net23's and icarus's dependencies and pinning Lambda's platform (linux, arm64, glibc), writes a hoisted-layout `.npmrc` and a blank `pnpm-workspace.yaml` to stop pnpm looking upward, and runs `pnpm install --prod` inside dist. It deletes sharp's musl binaries that pnpm insists on installing beside the glibc ones, copies icarus's .js files in as though they were an installed node module (grid.js excluded — the lambda never imports the grid suite), runs Vercel's node-file-trace from the src entry points and keeps only the node_modules files the trace proves reachable, and finally mutates dist's copy of wrapper.js, flipping `cloud` from false to true.

`serverless deploy` (framework v4) then runs with dist as its working directory. It reads `dist/serverless.yml`, and — v4 reads .env files automatically — resolves the remaining `${env:...}` values from `dist/.env` at package time: the certificate ARN and the CORS origins, none of them secrets. That resolution lands values as literal strings in the compiled artifacts, which is exactly why K10 doesn't travel that road: env-sourced values, as the framework's own documentation warns, "can be written into less protected or publicly accessible build logs, CloudFormation templates, et cetera" — the documented hazard the dynamic reference exists to avoid. Four files appear in `dist/.serverless/`: `cloudformation-template-update-stack.json` (the compiled template), `serverless-state.json` (the serialized service), `meta.json` (the framework's own build bookkeeping), and `net23.zip` (the code). Observed: the compiled template and the state file carry K10 only as the reference string, and the K10 tracer appears in dist exactly once — the `dist/.env` echo of the wholesale .env copy, deliberately left whole because stripping the line would protect nothing: the zip never packages .env, and dist sits on the same disk as the .env files it copies from.

The zip is the other half of the story, and it is clean. Observed: several thousand files, the assembled dist tree packaged verbatim — node_modules, src, persephone, package.json, the lockfile, the .npmrc — with no .env entry (the framework excludes .env files from packages by design) and, streaming the entire zip's contents through the search, zero K10 tracers. The S10 and P10 tracers ride in it once each, in node_modules/icarus/wrapper.js, as they should. K10 reaches the running lambda by a different road entirely: CloudFormation pulls it from Secrets Manager during the stack update and writes it into Lambda function configuration — a documented structural separation, code and configuration being distinct objects, with the environment variables never inside the code zip and the zip never containing the environment.

Provider-side, documented: the zip, the compiled template, and the state file all upload to the deployment S3 bucket under `serverless/net23/prod/<timestamp>/`. The template CloudFormation stores — retrievable through GetTemplate up to 90 days even after stack deletion — carries K10 only as the reference string, as does every deployment directory written since the reference replaced the value. The bucket keeps a short history, though, and directories older than the change still hold K10 in cleartext, from the era when the framework resolved it out of .env: the framework retains five deployments and prunes the rest, so those roll off within a few deploys, and rotating to a new K number makes whatever they still hold worthless. During the stack update, CloudFormation, acting with the deploy identity's credentials, calls Secrets Manager's GetSecretValue and writes the value into the Lambda function configuration — the one AWS place beyond the vault that holds it, encrypted at rest under an AWS-managed KMS key, readable by principals with GetFunctionConfiguration permission and by the console, and delivered to the runtime as ordinary process environment. The deploy pipeline is a courier of references; K10's only trip to AWS is the hand paste into Secrets Manager.

### The workers pipeline

`pnpm cloud` in site is a five-step sequence: set-cloud.js mutates the source tree's icarus/wrapper.js, flipping `cloud` to true; `nuxt build` builds everything; `wrangler deploy` uploads; set-local.js flips the source flag back; and the tests run. The source mutation is temporary but real — during the window between the first and fourth steps, the checked-out wrapper.js says cloud.

`nuxt build` is two builders in sequence. Vite, with Rollup underneath, builds the client: intermediate output lands in `.nuxt/dist/client` with content-hashed chunks under `_nuxt/`, and Nitro then carries those into `.output/public/_nuxt/` as the static assets. Nitro, running Rollup directly with esbuild as its transform, builds the server for the cloudflare-module preset: everything bundled, no externals, no node_modules directory, minified, code-split into `.output/server/index.mjs` and `chunks/` (the observed groups: `_`, `build`, `nitro`, `routes`, `virtual`). Because nuxt.config sets deployConfig, Nitro also generates `.output/server/wrangler.json` — merging the hand-written `site/wrangler.jsonc` with `main` and `assets` fields pointing at the build output — and writes `.wrangler/deploy/config.json`, the redirect that tells a bare `wrangler deploy` where the generated config lives.

Observed tracers, exactly where the design predicts: the S10 and P10 tracers appear in three files of `.output` — two server chunks (`chunks/nitro/nitro.mjs` and `chunks/build/server.mjs`) and one client chunk under `public/_nuxt/` — the wrapper riding wherever the module graph carried it, the client copy being today's ship-it-whole state that the pruning story above wants to end. The K10 tracer appears in no site artifact whatsoever. And one observation the tool corrected: `site/.nuxt` itself holds only templates, types, and manifests — the real build intermediates live under `site/node_modules/.cache/nuxt/.nuxt/`, where the census finds the client chunk, the SSR bundle, and its sourcemaps (a .map and a .map.json) all carrying the wrapper text. Build residue also collects in tooling's own files: the census named `site/size/.vite-inspect/` (captured transforms from the bundle-analysis reports) as a standing holder of the ciphertext, and transient working files — review scratch like diff.diff at the root — hold it while they exist. Harmless, and named so a clean run matches the list.

`wrangler deploy` uploads in two streams, documented: static assets first, content-addressed — wrangler builds a manifest of path-to-hash, and Cloudflare answers with only the hashes it doesn't already store, so unchanged files never re-upload — then the worker script as a multipart upload of modules plus a metadata JSON of bindings and settings. By default wrangler runs its own esbuild pass even over prebuilt output. Each deploy creates an immutable version holding bundled code, assets, bindings, and compatibility settings. And the fact that anchors the third-category story: Workers secrets are set once with `wrangler secret put`, stored encrypted, write-only after they're set, delivered to the runtime as environment bindings — and `wrangler deploy` neither uploads nor touches them.

### One deliberate exception, and the mechanism that carries it

Documented Nuxt behavior: the runtime config object is serialized verbatim into `.output/server/chunks/nitro/nitro.mjs` at build time — any key given a real value in nuxt.config rides that chunk in cleartext. That mechanism carries our one known, deliberate case of a decrypted value on disk: the og signing secret, supplied at build time from Key() into the og-image module's configuration, baked into the server bundle by design. og.md holds that decision and its threat analysis — the exposure is identical to the module's own default behavior, the server bundle never leaves Cloudflare, and the client bundle never carries it. The search treats it as a known, named exception rather than a leak; everything else that decrypts does so only in a running server's memory.

## What the search confirms

Each workspace builds through its own locations on disk — intermediate directories and final artifacts — and the confirmation runs over all of them, in both directions. The positive expectations: the tracers that should be present are, the wrapper riding where the wrapper rides — S10 and P10 in every delivered bundle, in the lambda zip's wrapper.js, in the three files of `.output`, in the nuxt build-cache intermediates under `site/node_modules/.cache/`, and in the named residue (the vite-inspect reports, and transient review scratch like diff.diff when present). The negative expectations, which are the point: the K10 tracer appears in no bundle or artifact delivered anywhere, and no decrypted value appears in anything the client is given.

The audit sharpened both lists with named residue. On the workstation, K10 legitimately appears in the .env files that hold it — at the root, in site, and in net23 — and in the lambda pipeline's one echo, `dist/.env`, the wholesale copy build.js makes; all of them persist after a deploy. And one decrypted value rides a server bundle by design — the og signing secret in the nitro chunk, the named exception above. A run that finds exactly this picture is clean; a hit anywhere else, or any tracer in the client bundle beyond P10 and today's S10 dead weight, is the alarm. We can see the tracers we should, and cannot find the tracers we shouldn't — and because the values are searchable by design, that assurance costs one command rather than an audit.

## A run of the census, recorded

The full census, run August 24, 2026, against the working tree and the artifacts of the latest builds. Safe to record because the output is only file paths and counts — the tool never prints what surrounds a hit. Lightly edited: log timestamps are trimmed, and the tool's closing line is left off, because it echoes the search term assembled and this essay never does.

The K10 census — the .env files that hold it and the one build echo, with the framework's compiled files carrying only reference strings:

```
   1  ./.env
   1  ./net23/.env
   1  ./net23/dist/.env
   1  ./site/.env
4 in 4 files
```

Streaming the lambda zip for the same marker: no matches — the delivered artifact holds no K10.

The S10 census — the sealed secret block — and the P10 census — the public block — identical file lists, because both ride in wrapper.js and travel wherever the module graph carries it:

```
   1  ./icarus/wrapper.js
   1  ./net23/dist/node_modules/icarus/wrapper.js
   1  ./site/.output/public/_nuxt/DSnDf7ll.js
   1  ./site/.output/server/chunks/build/server.mjs
   1  ./site/.output/server/chunks/nitro/nitro.mjs
   1  ./site/node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/DSnDf7ll.js
   1  ./site/node_modules/.cache/nuxt/.nuxt/dist/server/server.mjs
   1  ./site/node_modules/.cache/nuxt/.nuxt/dist/server/server.mjs.map
   1  ./site/node_modules/.cache/nuxt/.nuxt/dist/server/server.mjs.map.json
   1  ./site/size/.vite-inspect/reports/vite2-ssr/transforms/cGfxnsmy1qclDZFNKq9RspHBTtz35taPtPZuu65FJmE.json
10 in 10 files
```

Streaming the lambda zip: one match each — the wrapper riding inside the artifact, as designed. The census reads as the expected picture verbatim: source, the dist copy, the three files of `.output`, the four cache intermediates, the vite-inspect residue. Transient working files are the census's one moving part — review scratch like diff.diff at the root holds the ciphertext while it exists, and was deleted before this recorded run; when present, it's a benign entry the operator recognizes, which is why the expectations name kinds of files rather than fixed counts.

The E10 census — the envelope secret's own marker:

```
   1  ./.env.keys
1 in 1 files
```

That specific secret exists in its home and provably nowhere else. And the X10 census — the reserved example family — answering with xray's own documentation, exactly as the reservation promises:

```
   1  ./xray.js
   2  ./xray.md
3 in 2 files
```

This results section names every family bare — K10, X10 — without the word that assembles them, so recording the run added no new hits to its own census: the X count stays exactly the anatomy demonstration and the usage example. The run's verdict, in the essay's own terms: clean. Every tracer visible where it should be, findable nowhere it shouldn't.

## Two future stories, recorded, not scheduled

Two secrets-related designs we evaluated, want kept, and are deliberately not building now. Each is a real strengthening; neither is worth its complexity yet.

### Dual-layer encryption

Today K10 alone does everything, hand-set in each provider's secrets service — Workers secrets on Cloudflare, Secrets Manager on AWS with CloudFormation filling the lambda's environment from it at deploy — and held in staff workstations' .env files. Secure and simple — but a single breach that reaches a system holding the one key compromises the secrets, because the ciphertext ships in every bundle and the key alone completes the pair.

The stronger alternative: two symmetric keys used in sequence. No new cryptographic primitive — encrypt the plaintext with the first key to produce ciphertext, encrypt that ciphertext with the second key, and decrypt twice in reverse order. One key lives where server code can reach it at runtime but no bundle carries it — Workers secrets, or on AWS something like Secrets Manager. The other is deliberately and securely baked into the server bundle at build and deploy time, and kept out of every dashboard. Both keys are secret. Now an insider or intrusion that reaches only server bundles, or only the secrets system, holds half a lock: compromising the sealed values requires breaching two separate parts of a provider's systems and organization at once, where today one suffices.

We also evaluated public/private key pairs for this system and couldn't find a way they'd be necessary. The workstation that runs the seal necessarily holds every plaintext secret at that moment — it reads .env.keys in the clear — so keeping one half of a pair away from it would only prevent it from decrypting ciphertext it just produced from plaintext it still has. No win, just more complexity; the two-places strength above comes from two symmetric keys in two systems, not from asymmetry.

### Pruning the ciphertext from the client bundle

Today wrapper.js ships whole in every bundle for simplicity, carrying both wrapper.publicKeys and wrapper.secretKeys — so the client bundle delivers and makes public the ciphertext of the secrets. It cannot use it; it's dead weight behind AES-256-GCM. But it's also the appearance of a possible leak: it looks bad, essentially, and the S10 tracer showing in a public bundle is a hit a reader must know to excuse.

The story is to get the client bundle to exclude wrapper.secretKeys without writing don't-import code by hand. The client bundle is built by Vite with Rollup underneath, and Rollup prunes at module granularity: a module no client code reaches drops out of the graph. It does not prune properties out of one exported object literal, which is why a runtime `delete wrapper.secretKeys` wouldn't help — the property would die at runtime while its text still shipped. The candidate shapes: split wrapper.js in two, a public file and a secret file, so the client's import graph never touches the secret module and Rollup's ordinary pruning does the work; or a build-time text replacement in the client build, the trick set-cloud.js already proves for wrapper.cloud. We're looking for the simple one. When it lands, xray confirms where in the pipeline the ciphertext disappears and that the finished client bundle carries no S10 tracer — and the expected picture above sharpens, S10 becoming a server-only tracer whose appearance in a client bundle signals a leak the way K10's does anywhere.
