
import {visualizer} from 'rollup-plugin-visualizer'//from visualizer; $ yarn build to make stats.html
import {vite as vidstack} from 'vidstack/plugins'//from vidstack

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

	compatibilityDate: '2025-05-15',//from nuxt
	devtools: {enabled: true},//from nuxt
	modules: [
		'nitro-cloudflare-dev',//from cloudflare
		'@pinia/nuxt',//from pinia
		'@nuxtjs/tailwindcss',//from tailwind
		'nuxt-og-image',//from ogimage
	],
	vue: {
		compilerOptions: {
			isCustomElement: (tag) => tag.startsWith('media-'),//from vidstack
		},
	},
	vite: {
		plugins: [
			visualizer({//from visualizer
				filename: './stats.html',
				template: 'treemap',//try out "sunburst", "treemap", "network", "raw-data", or "list"
				brotliSize: true
			}),
			vidstack(),//from vidstack
		],
	},
	nitro: {
		preset: 'cloudflare_module',//from cloudflare
		cloudflare: {
			deployConfig: true,
			nodeCompat: true,
		},
		esbuild: {
			options: {
				target: 'esnext',//added to solve error on npm run build about es2019 not including bigint literals
			},
		},
	},
	runtimeConfig: {//added for getAccess; nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET,//ttd june, report in obsidian from chat about change this to use the nuxt prefix, and set here to blank, as right now this secret gets baked into the server bundle (still secure, but bad form) and doesn't actually get picked up from the dashboard at all! you could confirm by breaking in the dashboard and seeing if things still work
	},
	build: {
		sourcemap: true,//from visualizer; causes rollup to make stats.html
	},
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

	//from tailwind
	tailwindcss: {
		cssPath: '~/assets/css/tailwind.css',
	},

	//our customization
	components: {
		dirs: [
			{
				path: '~/components',
				pathPrefix: false,//let a template find <SomeComponent /> as you move SomeComponent.vue into and between subfolders of the components folder
			},
		],
	},
})
