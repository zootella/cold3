
import { visualizer } from 'rollup-plugin-visualizer'//npm run build generates stats.html, but npm run local does not

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

	//defaults, with some additions
	compatibilityDate: '2024-04-03',//default from $ npm create cloudflare@latest
	devtools: {
		enabled: true//default from create
	},
	nitro: {
		preset: 'cloudflare-pages',//default from create
		esbuild: {
			options: {
				target: 'esnext'//added to solve error on npm run build about es2019 not including bigint literals
			}
		},
	},
	modules: [
		'nitro-cloudflare-dev',//default from create
		'nuxt-og-image',//added for open graph cards
	],

	//added for secrets and access
	runtimeConfig: {//nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET
	},

	//added for rollup visualizer to make stats.html
	vite: {
		plugins: [
			visualizer({
				filename: './stats.html',
				template: 'treemap',//try out "sunburst", "treemap", "network", "raw-data", or "list"
				brotliSize: true
			})
		]
	},
	build: {
		sourcemap: true//added for visualizer
	},

	//added for open graph cards
	site: {
		url: 'https://cold3.cc',//added this for nuxt og image, which uses it to set absolute urls
		name: 'cold3.cc'
	},
	ogImage: {
		defaults: {
			cacheMaxAgeSeconds: 20*60//20 minutes in seconds; default if you omit this is 3 days
		},
		runtimeCacheStorage: {
			driver: 'cloudflare-kv-binding',
			binding: 'OG_IMAGE_CACHE'
		}
	}
})
