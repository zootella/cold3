
import { visualizer } from 'rollup-plugin-visualizer'//npm run build generates stats.html, but npm run local does not

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	nitro: {
		preset: 'cloudflare-pages',
		esbuild: {
			options: {
				target: 'esnext'//added to solve error on npm run build about es2019 not including bigint literals
			}
		},
	},
	modules: [
		'nitro-cloudflare-dev'
	],
	devtools: {
		enabled: true
	},
	runtimeConfig: {//nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET
	},
	build: {
		sourcemap: true,//added for visualizer
	},
	vite: {
		plugins: [
			visualizer({
				filename: './stats.html',
				template: 'treemap',//try out "sunburst", "treemap", "network", "raw-data", or "list"
				brotliSize: true
			})
		]
	}
})
