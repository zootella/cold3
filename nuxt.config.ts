
import { visualizer } from 'rollup-plugin-visualizer'

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

		//starting point to visualize nuxt server code, if you want to try that
		/*
		nitro: {
			hooks: {
				'compiled': async () => {
					const { visualizer } = await import('rollup-plugin-visualizer')
					const fs = await import('fs')
					const path = './.output/server/server.mjs'// Path to Nitro's server-side output

					const statsServer = visualizer({
						filename: './stats-server-api.html',  // Server-side stats output file
						template: 'treemap',                 // Visualization type
						brotliSize: true,                    // Show brotli size
					})

					// Apply the plugin to the server bundle
					const rollup = await import('rollup')
					const bundle = await rollup.rollup({
						input: path,
						plugins: [statsServer],
					})

					// Write the bundle
					await bundle.write({
						file: path,
						format: 'es'  // Output format for ESM
					})
				}
			}
		}
		*/
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
				template: 'treemap',//sunburst, treemap, network, raw-data, or list
				brotliSize: true
			})
		]
	}
})
