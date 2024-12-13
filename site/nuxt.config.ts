
//cold3

import {visualizer} from 'rollup-plugin-visualizer'//visualizer
import {vite as vidstack} from 'vidstack/plugins'//vidstack

export default defineNuxtConfig({

	compatibilityDate: '2024-04-03',//nuxt
	devtools: {enabled: true},//nuxt
	modules: [
		'nitro-cloudflare-dev',//cloudflare

		'nuxt-og-image',//ogimage
	],
	vue: {
		compilerOptions: {
			isCustomElement: (tag) => tag.startsWith('media-'),//vidstack
		},
	},
	vite: {
		plugins: [
			vidstack(),//vidstack
			visualizer({filename: './stats.html', template: 'treemap', brotliSize: true}),//visualizer
		]
	},
	nitro: {
		preset: 'cloudflare-pages',//cloudflare
		esbuild: {options: {target: 'esnext'}},//added for bigint
	},

	runtimeConfig: {ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET},//added for secrets

	build: {sourcemap: true},//visualizer

	site: {url: 'https://cold3.cc', name: 'cold3.cc'},//ogimage

	ogImage: {//ogimage
		defaults: {cacheMaxAgeSeconds: 20*60},
		runtimeCacheStorage: {driver: 'cloudflare-kv-binding', binding: 'OG_IMAGE_CACHE'}
	},

	css: [//vidstack, this is the weird fix that isn't necessary in cute4, delete it!
		'vidstack/player/styles/default/layouts/video.css',
	],
})
