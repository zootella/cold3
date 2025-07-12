//./nuxt.config.js

import {vite as vidstack} from 'vidstack/plugins'

//configuration object we'll populate, submit, and export the result
const configuration = {//set up empty structure to fill below
	modules: [],
	vue: {compilerOptions: {}},
	vite: {plugins: []},
	app: {head: {link: []}},
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
configuration.tailwindcss = {cssPath: '~/assets/css/style.css'}

//for google fonts
configuration.app.head.link.push({
	rel: 'stylesheet',
	href: 'https://fonts.googleapis.com/css2?' + (
					'family=Noto+Sans:ital,wght@0,400;1,400;0,700;1,700' +
		'&family=Noto+Sans+Mono:ital,wght@0,400;1,400;0,700;1,700' +
						'&family=Roboto:ital,wght@0,400;1,400;0,500;1,500' +//note 500, tailwind semibold
		'&display=swap' +
		'&subset=latin,latin-ext')//just basic latin characters
})

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
