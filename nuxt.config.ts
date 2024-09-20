// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	nitro: {
		preset: 'cloudflare-pages',
		esbuild: { options: { target: 'esnext' } },//added to solve error on $ npm run build about es2019 not including bigint literals
	},
	devtools: { enabled: true }
})
