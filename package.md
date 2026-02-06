
# package.json Notes

## Update Once a Year 🌅

Every framework version has a lifecycle, and there's a sweet spot in the middle of it. Move too early and you pay the pioneer tax — modules have bugs, edge cases are uncharted, you're debugging the platform instead of building product, and the problems you solve will solve themselves in a few months anyway. Move too late and you pay the stagnation tax — dependencies start requiring the new major, security patches slow down, you can't update within your declared semver ranges, and what would have been a two-day migration in January becomes a two-week one in June.

Nuxt ships a new major roughly every summer. The sweet spot is midwinter — about six months after release. Major bugs are fixed, module authors have updated, the ecosystem has settled. You still have a full runway before the next cycle starts. The discipline is to treat migration as a scheduled event, not something you do reactively when forced or rush into the moment a new version drops. Once a year, in the middle of the cycle, when the version is proven and the runway is long.

## Update Everything at Once 🩹

We took the "tear off the bandaid" approach: make all changes without running the code, then fix whatever breaks. This worked, and it worked because of the fresh scaffold. We scaffolded a fresh Nuxt 4 project on Cloudflare Workers, then systematically matched our site to it — versions, directory structure, config patterns — outwards to inwards, dependencies first, then configuration, then code.

The alternative — incremental migration with compatibility flags, codemods, and one-change-at-a-time testing — would have been worse. Not just slower (two days of work stretched to two weeks of context-switching), but genuinely riskier. Incremental migration can lead you into impossible intermediate states: a half-upgraded dependency tree where nothing works forward or backward. Nuxt's `future: { compatibilityVersion: 4 }` compatibility mode doesn't know about Cloudflare Workers. Codemods don't know about our h3 abstraction layer or og-image's WASM constraints. Each cautious intermediate test would have been testing a combination that nobody upstream ever tested.

The all-at-once approach avoided this by targeting a known-good end state (the scaffold) rather than navigating through unknown intermediate states. The safety net wasn't incremental testing — it was git. `git switch main` returns to working Nuxt 3 at any time. Fix forward or retreat completely — no partial rollbacks, no "keep this module on the old version while upgrading the rest."

This approach does require fixing forward through surprises. We hit h3 v2 shadowing, WASM breakage on Workers, and a three-migration dependency chain. But each surprise was encountered with the full picture visible — all the changes on the table, all the versions aligned to the target — not buried under layers of incremental half-changes where any one of a dozen intermediate steps could be the culprit.

## Scaffold Fresh 🍓

Modern full-stack JavaScript has several top-level dependencies the team is responsible for: cloud provider, package manager, web framework, their associated tooling, and framework modules. These compete for authority — Nuxt, Cloudflare's CLI, and pnpm each assume they're the starting point and everything else will follow their conventions. Each releases major versions on its own schedule, and their ecosystems of modules follow. When Nuxt 4 ships, Pinia updates, Tailwind updates, Wrangler updates its integration — and each brings its own dependency tree and peer dependency requirements.

This creates a difficult reality. There is no single source of truth for "what versions work together." Nuxt's migration guide doesn't know about Cloudflare. Cloudflare's scaffold doesn't know about og-image. og-image's docs don't know about your WASM constraints on Workers. Upgrading in place means changing one thing, watching peer dependencies conflict, chasing errors through transitive dependency mazes, and never being sure if the problem is your code, your config, or dependency hell.

Scaffolding fresh cuts through this. Run `pnpm create cloudflare@latest`, pick Nuxt, add your modules with `nuxi module add` — and you have a working project that represents the current blessed combination of versions and configs as the CLI tools understand it today. Not what the docs say should work, not what worked six months ago, but what actually resolves and builds right now. This is your reference point. Compare it against your current setup, and you know exactly what needs to change. The scaffold is disposable — an inert folder you examine and discard. Your real project keeps its git history, deployment pipeline, and wrangler bindings. The scaffold just tells you where to aim.

```
  steps to quickly scaffold the cloudflare nuxt stack and modules, 2026feb3
  these are designed to be easy to paste in one line at a time rather than typing or this being a script
  start in ~/Documents/code/temp

rm -rf fresh1
pnpm create cloudflare@latest
  type name fresh1, framework starter, nuxt, no official modules, no git, no deploy)
cd fresh1
git init
git add . && git commit -m "1nuxt"

pnpm dlx nuxi@latest module add pinia
git diff > 2pinia.diff && git add . && git commit -m "2pinia"

pnpm dlx nuxi@latest module add og-image
git diff > 3ogimage.diff && git add . && git commit -m "3ogimage"

pnpm dlx nuxi@latest module add tailwindcss
pnpm why tailwindcss > 4tailwind.txt
git diff > 4tailwind.diff && git add . && git commit -m "4tailwind"

pnpm add vidstack@next
git diff > 5vidstack.diff && git add . && git commit -m "5vidstack"

rm -rf .git .nuxt .output .vscode .wrangler node_modules
cd ../..
rm -rf cold3/fresh1
mv temp/fresh1 cold3/fresh1

  fresh1 will be an inert folder in the monorepo, alongside named workspace folders
  and you and claude can examine
  you can also $ cp -r fresh1 fresh2 to boil down fresh2 as you update or decline granular differences
```


ttd february, condense and update below
- nuxi effects section is from recent scaffolding
- why tailwind doesn't matter now that we're on tailwind 4 and it's listd in package.json directly
- package.json notes after that are all from the old days on yarn classic with nuxt 3






## nuxi effects

scaffolded fresh 2026feb3, nuxi add brought in these peer dependencies:

$ pnpm dlx nuxi@latest module add pinia
```diff
 	"dependencies": {
+		"@pinia/nuxt": "0.11.3",
+		"pinia": "^3.0.4",
 		"vue": "^3.5.27",
 		"vue-router": "^4.6.4"
 	},
```

$ pnpm dlx nuxi@latest module add og-image
```diff
 	"dependencies": {
 		"@pinia/nuxt": "0.11.3",
+		"nuxt-og-image": "5.1.13",
+		"@unhead/vue": "^2.1.2",
+		"unstorage": "^1.17.4",
 		"vue": "^3.5.27",
 		"vue-router": "^4.6.4"
 	},
```

$ pnpm dlx nuxi@latest module add tailwindcss
$ pnpm add vidstack@next
```diff
 	"dependencies": {
+		"@nuxtjs/tailwindcss": "6.14.0",
+		"vidstack": "^1.12.13",
 		"@pinia/nuxt": "0.11.3",
 		"@unhead/vue": "^2.1.2",
 		"nuxt": "^4.3.0",
```

$ pnpm why tailwindcss > 4tailwind.txt
```
Legend: production dependency, optional only, dev only

fresh-today ~/Documents/code/temp/fresh-today (PRIVATE)

dependencies:
@nuxtjs/tailwindcss 6.14.0
├─┬ tailwind-config-viewer 2.0.4
│ └── tailwindcss 3.4.19 peer
└── tailwindcss 3.4.19
```

So we get **tailwindcss 3.4.19** as a transitive dependency of `@nuxtjs/tailwindcss` (which appears in our package.json, and is at version 6). You don't declare `tailwindcss` directly in package.json — the Nuxt module brings it in. This means we're on Tailwind 3.x, not Tailwind 4.x. Tailwind 4 is a major rewrite with CSS-first configuration — a separate migration if we ever want it.

## package.json notes

**ttd february update for nuxt 4, all below is from nuxt 3! also, do we need this now that we have sem.yaml?**

1 icarus
2 utility
3 service
4 framework, these are the four categories we use below:

./package.json (root)
```json
{
	"name": "w5",
	"dependencies": {

		//1 icarus
		"icarus": "*"
	},
	"devDependencies": {

		//2 utility
		"@electric-sql/pglite": "^0.3.14",//wasm PostgreSQL build for $ yarn grid tests in local development
		"fast-glob": "^3.3.2",//yarn seal uses fast-glob; yarn wash uses rimraf, install that one globally
		"nanoid": "^5.1.5",
		"otpauth": "^9.4.1",//these two are for fuzz tests you can turn on in level1 and run with $ yarn test
		"semver": "^7.7.3",
		"yaml": "^2.8.2",//these two are for sem.js to make sem.yaml
	}
}
```

./icarus/package.json
```json
{
	"name": "icarus",
	"dependencies": {

		//2 utility
		"credit-card-type": "^10.0.0",
		"libphonenumber-js": "^1.11.3",
		"zod": "^3.25.74",
		"is-mobile": "^5.0.0",//runs fine everywhere, but only makes sense running from browser client
		"viem": "^2.37.3",//in icarus as well as site to validate ethereum addresses, net23.zip +10mb with viem and ox

		//3 service
		"@supabase/supabase-js": "^2.39.8",//supabase works local | deployed × worker | lambda

		//4 framework
		"h3": "^1.13.0",
		"ofetch": "^1.4.1",//nuxt brings in these two; added them to icarus to code can use them directly in icarus for lambda
	},
	"devDependencies": {

		//2 utility

		//4 framework
		"@vitejs/plugin-vue": "^5.0.4",
		"vite": "^6.2.6",
		"vue": "^3.5.16",
		"vue-router": "^4.5.1",
	}
}
```

./net23/package.json
```json
{
	"name": "net23",
	"dependencies": {

		//1 icarus
		"icarus": "*",

		//2 utility
		"sharp": "^0.34.4",//needs native modules that get into net23.zip with the stowaway.js script

		//3 service
		"twilio": "^5.3.5",
		"@sendgrid/mail": "^8.1.4",
	},
	"devDependencies": {

		//2 utility
		"fs-extra": "^11.2.0",//for stowaway script

		//3 service
		"@aws-sdk/client-ses": "^3.682.0",//aws sdk v3 parts are already on lambda; these dev dependencies just for local development
		"@aws-sdk/client-sns": "^3.682.0",
		"@aws-sdk/client-s3": "^3.975.0",
		"@aws-sdk/s3-request-presigner": "^3.975.0",
		"@vercel/nft": "^0.29.2",//vercel's node file trace to build a lean net23.zip

		//4 framework
		"serverless": "^4.4.11",
		"serverless-offline": "^14.3.4",
	}
}
```

./oauth/package.json
```json
{
	"name": "oauth",
	"dependencies": {

		//1 icarus
		"icarus": "*",

		//2 utility
		"@auth/sveltekit": "^1.9.2",
	},
	"devDependencies": {

		//3 service
		"wrangler": "^4.20.0",

		//4 framework
		"@sveltejs/adapter-auto": "^6.0.0",
		"@sveltejs/adapter-cloudflare": "^7.0.4",
		"@sveltejs/kit": "^2.16.0",
		"@sveltejs/vite-plugin-svelte": "^5.0.0",
		"svelte": "^5.0.0",
		"vite": "^6.2.6",
	}
}
```

./site/package.json
```json
{
	"name": "site4",
	"dependencies": {

		//1 icarus
		"icarus": "*",

		//2 utility, individual
		"qrcode": "^1.5.4",//importable in node and browser but not web worker!
		"vidstack": "^1.12.13",

		//utility, nuxt-og-image, $ nuxi module add og-image brings in these three
		"nuxt-og-image": "^5.1.6",//trying out letting this go higher than exactly 5.1.6 after seeing that a new scaffold did so
		"@unhead/vue": "^2.0.5",
		"unstorage": "^1.15.0",//universal key-value storage abstraction with multiple driver backends

		//utility, viem and wagmi
		"viem": "^2.37.3",//functions to read, write, encode for the ethereum blockchain
		"@wagmi/core": "^2.20.3",//wallet connection state management
		"@wagmi/connectors": "^5.9.9",//adapters for metamask, walletconnect, and other wallets
		"@tanstack/vue-query": "^5.87.1",//peer dependency of wagmi vue to do async state, caching, and avoid duplicating requests

		//utility, uppy
		"@uppy/core": "^5.2.0",//file upload orchestrator: state, events, restrictions, plugin system
		"@uppy/dashboard": "^5.1.0",//full-featured upload ui: drag-drop, progress, previews, file list
		"@uppy/aws-s3": "^5.1.0",//upload destination plugin for s3 via presigned urls, includes multipart

		//4 framework
		"@pinia/nuxt": "^0.11.1",
		"nuxt": "^3.17.5",
		"pinia": "^3.0.3",
		"vue": "^3.5.16",
		"vue-router": "^4.5.1",
	},
	"devDependencies": {

		//2 utility
		"pino-pretty": "^13.1.1",//added to fix build error caused by wagmi connectors bringing in walletconnect and wanting pino

		//3 service
		"wrangler": "^4.20.0",
		"nitro-cloudflare-dev": "^0.2.2",

		//4 framework
		"@nuxtjs/tailwindcss": "^6.14.0",
		"nitropack": "^2.11.12",
		"nuxi": "^3.25.1",//added nuxt's framework cli to run some things directly sometimes
	}
}
```
