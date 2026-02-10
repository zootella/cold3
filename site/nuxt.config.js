
import {
Time, inSeconds, Key, log, look,
} from 'icarus'//local Node runs this file on $ nuxt dev, build, generate; we can use icarus helpers here
import {vite as vidstack} from 'vidstack/plugins'
import tailwindcss from '@tailwindcss/vite'

/*
$ cloudflare create
scaffolded file linked
https://nuxt.com/docs/api/configuration/nuxt-config

configuration object we'll populate, submit, and export the result
replaced common declarative structure with this imperitive pattern
to be able to group subject areas together and comment them out individually for testing
*/
const configuration = {
	modules: [],
	vue: {compilerOptions: {}},
	vite: {plugins: []},
	app: {head: {link: []}},
}

//for Nuxt and Nitro
configuration.compatibilityDate = '2025-07-15'//⌚ 2026feb3 set date from fresh scaffolding; pin Nitro and other Nuxt modules to this date of behavior to avoid breaking changes from Nuxt ecosystem updates
configuration.devtools = {enabled: true}//enable the Nuxt devtools extension in the browser when running locally

//for build analysis and visualization
configuration.build = {
	analyze: {//enable Nuxt’s built-in analyzer, which uses Rollup Plugin Visualizer under the hood
		template: 'treemap',//try out "treemap", "sunburst", "network", "raw-data", or "list"; note these only affect client.html
		brotliSize: true,//current browsers downloading from Cloudflare will use Brotli compression
	},
}
configuration.analyzeDir = 'size'//put the report files in a folder named "size" rather than .nuxt/analyze

//for Cloudflare Workers
//scaffolding may have come with configuration.modules.push('nitro-cloudflare-dev') but we removed it; Nitro >=2.12 runs a local miniflare instance to emulate Cloudflare bindings natively during dev
configuration.nitro = {
	preset: 'cloudflare_module',//tell Nitro to build for Cloudflare Workers
	cloudflare: {
		deployConfig: true,//tell Nitro to generate Wrangler settings from its defaults and our wrangler.jsonc file
		nodeCompat: true,//bundle in compatability polyfills for core Node modules; this is about Node compatability at *build* time
	},
}

//added to solve error on npm run build about ES2019 not including BigInt literals
configuration.nitro.esbuild = {
	options: {target: 'esnext'},
}

//added so we a template can find <SomeComponent /> with SomeComponent.vue organized into a subfolder of the components folder
configuration.components = {
	dirs: [{path: '~/components', pathPrefix: false}],
}

//for tailwind
configuration.css = ['./app/assets/css/style.css']
configuration.vite.plugins.push(tailwindcss())

//for google fonts
configuration.app.head.link.push({
	rel: 'stylesheet',
	href: 'https://fonts.googleapis.com/css2?' + (
					'family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700' +
		'&family=Noto+Sans+Mono:ital,wght@0,400;0,700;1,400;1,700' +
						'&family=Roboto:ital,wght@0,400;0,500;1,400;1,500' +//note 500, tailwind semibold
		'&display=swap')//CSS2 API does unicode-range subsetting automatically
})

//for pinia
configuration.modules.push('@pinia/nuxt')

//for nuxt-og-image
configuration.modules.push('nuxt-og-image')
configuration.site = {
	name: Key('domain, public'),
	url: 'https://'+Key('domain, public'),//needs site's deployed domain to link the cards in the page meta tags with absolute URLs
}
configuration.ogImage = {
	//nuxt-og-image's docs recommend Cloudflare KV for caching rendered cards. That doesn't fit our needs 🍞 Our cards don't go stale; re-rendering one would produce identical pixels 🧟 There's no way to configure expiration, every KV entry stays forever! 🔥 Instead we wrote middleware.js to use Cloudflare's CDN: it serves hot cards from cache globally, evicts cold cards automatically via TTL, and costs nothing on our account 💸 The lru-cache driver keeps nuxt-og-image's internal cache effectively inert so the CDN is the only real caching layer
	defaults: {
		cacheMaxAgeSeconds: inSeconds(20*Time.minute)//a popular card will get rendered once per 20min per cloudflare CDN region. From nuxt-og-image's cache.js this setting fans out three places: (1) the `Cache-Control` header that enables the CDN, (2) the storage driver's expiresAt entry, (3) `maxAge` in h3's `handleCacheHeaders` for 304 conditional requests; Only (1) matters for us, but there's no way to set it independently
	},
	runtimeCacheStorage: {
		driver: 'lru-cache',//unstorage's bounded cache driver, backed by lru-cache v11 (already in our tree as a transitive dep of unstorage). Without this, the default is a plain Map with no size limit, so memory would only grow in the isolate
		max: 1,//only hold the single most recently rendered card; the CDN edge cache is our real cache layer; lru-cache doesn't allow 0 here
	},
}

//for vidstack
configuration.vue.compilerOptions.isCustomElement = (tag) => tag.startsWith('media-')
configuration.vite.plugins.push(vidstack())

/*
pglite asset exclusion 🛢 2026feb7

pglite (@electric-sql/pglite) is an in-memory PostgreSQL used only for local unit testing via pgliteDynamicImport() in icarus/level1.js. It ships a pglite.wasm (8.8MB) and pglite.data (4.9MB) that are referenced inside its source with the pattern new URL("./pglite.wasm", import.meta.url)

The dynamic import() in level1.js already has @vite-ignore which successfully prevents pglite's JS from being bundled into any client chunk. However, Vite has a separate asset pipeline that detects the new URL("...", import.meta.url) pattern in any module it scans, and copies those files to the client output as static assets — independent of whether the JS import was ignored. This was putting 14MB of pglite binaries into .output/public/_nuxt/ even though no browser or Worker ever loads them.

The fix is to tell Rollup to externalize pglite entirely. This prevents Vite from scanning pglite's source files at all, so the new URL() asset references are never discovered. We discovered this issue by running nuxi analyze and noticing pglite.wasm and pglite.data in the client build output. Total CDN output is 24MB with if false below, 8MB if true. Cloudflare Workers has a static asset size limit, so this matters.

To verify, delete .output node_modules/.cache/nuxt && pnpm build, then check that .output/public/_nuxt/ has no pglite files. The Nuxt build cache at node_modules/.cache/nuxt persists assets across rebuilds, so you must clear it when testing changes to this setting. The root workspace pnpm wash script deletes node_modules entirely, so you can use that.
*/
if (true) configuration.vite.build = {rollupOptions: {external: ['@electric-sql/pglite']}}//if true to make this easily switchable

export default defineNuxtConfig(configuration)
