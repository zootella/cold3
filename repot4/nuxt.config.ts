//in the workspace "repot4", this is the file ./nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-06-10',//Nitro uses this date when building; sets runtime behavior and polyfills
	devtools: {
		enabled: true,
	},
	nitro: {
		preset: "cloudflare_module",//note the underscore not hyphen, choosing Nitro's new better preset for Cloudflare
		cloudflare: {
			deployConfig: true,
			nodeCompat: true,
		},
	},
	modules: [
		"nitro-cloudflare-dev",
		"@nuxtjs/tailwindcss",
		"@pinia/nuxt",
		"nuxt-og-image",
	],
})
