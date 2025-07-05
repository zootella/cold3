//./nuxt.config.ts

import {vite as vidstack} from 'vidstack/plugins'

//configuration object we'll populate, submit, and export the result
const configuration = {
	modules: [],//set up empty structure to fill below
	vue: {
		compilerOptions: {},
	},
	vite: {
		plugins: [],
	},
}

//for Nuxt and Nitro
configuration.compatibilityDate = '2025-06-10'//pin Nitro and other Nuxt modules to follow this date of behavior to include (or avoid) breaking changes
configuration.devtools = {enabled: true}//enable the Nuxt devtools extension in the browser when running locally

//for Cloudflare Workers
configuration.modules.push('nitro-cloudflare-dev')//run locally with a Miniflare Wrangler development proxy
configuration.nitro = {
	preset: "cloudflare_module",//tell Nitro to build for Cloudflare Workers
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
configuration.modules.push('@nuxtjs/tailwindcss')
configuration.tailwindcss = {cssPath: '~/assets/css/tailwind.css'}
//ttd june, rename this file to match more common scaffolding

//for pinia
configuration.modules.push('@pinia/nuxt')

//for nuxt-og-image
configuration.modules.push('nuxt-og-image')
configuration.site = {
	name: 'cold3.cc',
	url: 'https://cold3.cc',//needs site's deployed domain to link the cards in the page meta tags with absolute URLs
}
configuration.ogImage = {
	defaults: {
		cacheMaxAgeSeconds: 20*60,//20 minutes in seconds; default if omitted is 3 days
	},
	runtimeCacheStorage: {
		driver: 'cloudflare-kv-binding',
		binding: 'OG_IMAGE_CACHE',
	},
}

//for vidstack
configuration.vue.compilerOptions.isCustomElement = (tag) => tag.startsWith('media-')
configuration.vite.plugins.push(vidstack())

export default defineNuxtConfig(configuration)

/*
notes from $ cloudflare create
https://nuxt.com/docs/api/configuration/nuxt-config
*/

/*
ttd june, previous visualizer; now there's a built-in one, but you still need a place to say treemap or sunburst

	import {visualizer} from 'rollup-plugin-visualizer'//from visualizer; $ yarn build to make stats.html

	vite: {
		plugins: [
			visualizer({//from visualizer
				filename: './stats.html',
				template: 'treemap',//try out "sunburst", "treemap", "network", "raw-data", or "list"
				brotliSize: true
			}),
		],
	},

	build: {
		sourcemap: true,//from visualizer; causes rollup to make stats.html
	},
*/






/*
notes from 2025jul5, lost a full day

you did powerwash
and then there's an error about joi trying to use self
error meant yarn local didn't work at all
but yarn preview still works, and deploy still works

went in circles with chat all day trying solutions, mostly here, below
ended up reverting to yarn.local from this morning, which works

//solution attempt (1c)
//added to solve "Error: self is not defined" when running locally
const list1 = [
	//joi's browser bundle references self during ssr
	'joi',//externalize imports of joi
	'joi/dist/joi-browser.min.js',//externalize the browser bundle path it actually inlines
]
configuration.vite.ssr = {external: [/^joi($|\/)/]}//tell Vite to use Node's require() instead of their browser bundles
configuration.vite.optimizeDeps = {exclude: ['joi']}//running locally, skip pre-bundling these modules in the Vite dev server

//solution attempt (2), doesn't work
configuration.vite.resolve = {browserField: false}//instead of that, which didn't change the error, trying to turn this off globally

//solution attempt (3), global and not yet tested; we'd prefer a fix for just joi, 1b, above
configuration.vite.resolve = {mainFields: ['module', 'main']}

//solution attempt (4) the alias approach, no change to the error
configuration.vite.resolve = {
	alias: {
		'joi/dist/joi-browser.min.js': 'joi/lib/index.js'//alias the browser build to the Node CJS entry
	}
}

// solution attempt (5): dev-only `self` polyfill for SSR (this one involves a separate file)
// ~/plugins/self-polyfill.server.js
export default defineNuxtPlugin(() => {
	// Only in `nuxt dev` SSR
	if (process.dev && process.server && typeof globalThis.self === 'undefined') {
		// @ts-expect-error — we’re intentionally injecting the Worker global
		globalThis.self = globalThis
	}
})

//solution attempt (6): in nuxt dev, treat SSR as Node and drop browser field ──
if (process.dev) {
	// force Vite SSR to target Node (so it picks CJS entrypoints, not browser bundles)
	configuration.vite.ssr = {target: 'node'}
	// drop any 'browser' mappings locally—resolve by module → main only
	configuration.vite.resolve = {mainFields: ['module', 'main']}
}

// solution attempt (7): in dev, alias joi → its Node CJS entry
if (process.dev) {
	// ensure resolve object exists
	// merge in our alias without overwriting other settings
	configuration.vite.resolve = {
		alias: {
			'joi': 'joi/lib/index.js'
		}
	}
}
// ── solution attempt (8): compile-time replace `self` → `globalThis` in dev ──
if (process.dev) {
	// Ensure any `self` references become `globalThis`
	configuration.vite.define = {
		self: 'globalThis'
	}
}
*/
