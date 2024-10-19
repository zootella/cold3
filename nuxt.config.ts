// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',
	nitro: {
		preset: 'cloudflare-pages',
		esbuild: {
			options: {
				target: 'esnext'//added to solve error on npm run build about es2019 not including bigint literals
			}
		}
	},
	modules: [
		'nitro-cloudflare-dev'
	],
	devtools: {
		enabled: true
	},
	runtimeConfig: {//nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET
	}
})
