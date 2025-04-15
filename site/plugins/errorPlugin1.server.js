//./plugins/errorPlugin1.server.js

//server
/*
export default defineNuxtPlugin(async (nuxtApp) => {
	nuxtApp.hook('app:error', async (error) => {//this should catch errors errors after Nuxt has bootstrapped the application, including SSR, store creation, and other plugin-driven areas
		try {
			await awaitLogAlert('nuxt plugin app error', {error, event})
		} catch (e) {
			console.error('[OUTER]', e, error, event)//if trying to reach datadog throws, fall back to the simple way
		}
	})
})
*/
