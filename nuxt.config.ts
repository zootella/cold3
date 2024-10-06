// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',//added to remove warning, not sure what it does here, also not the same as the date in wrangler.toml
	nitro: {
		preset: 'cloudflare-pages',
		esbuild: { options: { target: 'esnext' } },//added to solve error on $ npm run build about es2019 not including bigint literals
	},
  modules: ['nitro-cloudflare-dev'],//came in from repot but mistakingly omitted from working test, going to include it in actual but watch carefully
	devtools: { enabled: true }
})
