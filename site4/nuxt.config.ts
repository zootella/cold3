//in the workspace "site4", this is the file ./nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config

let configuration = {}//configuration object we'll populate, submit, and export

configuration.compatibilityDate = '2025-06-10'//Nitro uses this date when building; sets runtime behavior and polyfills
configuration.devtools = {enabled: true}
configuration.nitro = {
	preset: "cloudflare_module",//note the underscore not hyphen, choosing Nitro's new better preset for Cloudflare
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,//ttd june, omitted node compatibility in wrangler.jsonc, but here we're setting to true?
	},
}
configuration.modules = []
configuration.modules.push('nitro-cloudflare-dev')
configuration.modules.push('@nuxtjs/tailwindcss')
configuration.modules.push('@pinia/nuxt')
configuration.modules.push('nuxt-og-image')

export default defineNuxtConfig(configuration)

/* for sorting components into subfolders

	//our customization
	components: {
		dirs: [
			{
				path: '~/components',
				pathPrefix: false,//let a template find <SomeComponent /> as you move SomeComponent.vue into and between subfolders of the components folder
			},
		],
	},
*/

/* for secrets, you'll likely need this right away

	runtimeConfig: {//added for getAccess; nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET,//ttd june, report in obsidian from chat about change this to use the nuxt prefix, and set here to blank, as right now this secret gets baked into the server bundle (still secure, but bad form) and doesn't actually get picked up from the dashboard at all! you could confirm by breaking in the dashboard and seeing if things still work
	},
*/

/* for bigint, hopefully bigint tests will run and you just omit this fix

	nitro: {
		esbuild: {
			options: {
				target: 'esnext',//added to solve error on npm run build about es2019 not including bigint literals
			},
		},
	},
*/

/* for tailwind, use the new pattern from the separate repo

	//from tailwind
	tailwindcss: {
		cssPath: '~/assets/css/tailwind.css',
	},
*/

/* for ogimage

	site: {//from ogimage
		url: 'https://cold3.cc',//ogimage needs site's deployed domain to set absolute urls in the cards
		name: 'cold3.cc',
	},

	//from ogimage
	ogImage: {
		defaults: {
			cacheMaxAgeSeconds: 20*60,//20 minutes in seconds; default if you omit this is 3 days
		},
		runtimeCacheStorage: {
			driver: 'cloudflare-kv-binding',
			binding: 'OG_IMAGE_CACHE',
		},
	},
*/

/* for vidstack, add this back from current guide

	import {vite as vidstack} from 'vidstack/plugins'//from vidstack

	vue: {
		compilerOptions: {
			isCustomElement: (tag) => tag.startsWith('media-'),//from vidstack
		},
	},
	vite: {
		plugins: [
			vidstack(),//from vidstack
		],
	},
*/

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







