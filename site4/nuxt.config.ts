//in the workspace "site4", this is the file ./nuxt.config.ts

import {vite as vidstack} from 'vidstack/plugins'

let configuration = {}//configuration object we'll populate, submit, and export
configuration.modules = []
configuration.vue = {compilerOptions: {}}
configuration.vite = {plugins: []}//set up empty structure to fill below

//for nuxt and nitro
configuration.compatibilityDate = '2025-06-02'//pin nitro and other nuxt modules to follow this date of behavior to include or avoid breaking changes
configuration.devtools = {enabled: true}//enable the nuxt devtools extension in the browser when running locally

//for cloudflare workers
configuration.modules.push('nitro-cloudflare-dev')//enable local development with a miniflare wrangler development proxy
configuration.nitro = {
	preset: "cloudflare_module",//tell nitro to build for cloudflare workers
	cloudflare: {
		deployConfig: true,//tell nitro to generate wrangler.jsonc from ours
		nodeCompat: true,//bundle in compatability polyfills for crypto, buffer, stream, and the other node modules; this is about node compatability at build time
	},
}

//added to solve error on npm run build about es2019 not including bigint literals
configuration.nitro.esbuild = {
	options: {target: 'esnext'},
}

//added so we a template can find <SomeComponent /> with SomeComponent.vue organized into a subfolder in the components folder
configuration.components = {
	dirs: [{path: '~/components', pathPrefix: false}],
}

//added for secrets
configuration.runtimeConfig = {
	ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET,
	//ttd june, change this to NUXT_ACCESS_KEY_SECRET in secret files, and here as accessKeySecret, and then it'll not be built into the server bundle, always come from the dashboard, and useRuntimeConfig().accessKeySecret is how you get it
}

//for tailwind
configuration.modules.push('@nuxtjs/tailwindcss')
configuration.tailwindcss = {cssPath: '~/assets/css/tailwind.css'}

//for pinia
configuration.modules.push('@pinia/nuxt')

//for nuxt-og-image
configuration.modules.push('nuxt-og-image')
configuration.site = {
	name: 'cold3.cc',
	url: 'https://cold3.cc',//ogimage needs site's deployed domain to set absolute urls in the cards
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
ttd june, notes about secrets, above

added for getAccess; nuxt promises these will be available on the server side, and never exposed to a client

//ttd june, report in obsidian from chat about change this to use the nuxt prefix, and set here to blank, as right now this secret gets baked into the server bundle (still secure, but bad form) and doesn't actually get picked up from the dashboard at all! you could confirm by breaking in the dashboard and seeing if things still work

*/


// https://nuxt.com/docs/api/configuration/nuxt-config




/* for visualizer, use the built-in visualizer instead

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







