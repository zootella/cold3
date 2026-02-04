
# package.json notes

you can't write comments in package.json, so here are some alongside
also generate a fresh sem.yaml, of course; these are the manual notes

## scaffold fresh

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
