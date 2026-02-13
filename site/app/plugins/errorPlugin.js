
export default defineNuxtPlugin((nuxtApp) => {

	//startup: SSR failures, plugin initialization, first hydrate/mount
	nuxtApp.hook('app:error', async (error) => {
		return await handleError({source: 'Nuxt.', error})
	})

	//runtime: render functions, lifecycle hooks, setup, watchers, event handlers
	nuxtApp.hook('vue:error', async (error, instance, info) => {
		return await handleError({source: 'Vue.', error, instance, info})
	})

	//these two hooks provide complete coverage. Vue also has config.errorHandler, but we don't use it: with errorHandler, Vue considers the error "handled" and stops propagation, so you'd have to rethrow to reach error.vue. with vue:error, the error keeps propagating naturally and our handler piggybacks on it to call showError(). vue:error also supports async, which we need for server-side Datadog logging

	//additionally, we intentionally avoid three client-side listeners: router.onError, window 'error', and window 'unhandledrejection'. router.onError is narrow (navigation failures only) but redundant; app:error already covers those. the two window listeners are the opposite problem: they catch every uncaught error on the page, including from third-party scripts and browser extensions
})

async function handleError(details) {
	log(`🚧 🚧 🚧 🚧 🚧 ${Sticker()} "${details?.error?.message}"`)//ttd april2025, remove this line when errors have settled down!
	if (import.meta.server) {
		try {
			await awaitLogAlert('error plugin', details)//log the error to datadog, including all details
		} catch (e) { console.error('[OUTER]', e, details) }//catch an error trying to log the first one; fall back to standard error
		//on the server, return nothing; the response puts the page into the error.vue state
	} else if (import.meta.client) {
		const pageStore = usePageStore()//use the error store to save a single error, and only call showError once
		if (pageStore.errorDetails) {
			log('already put page in error state, doing nothing with:', look(details))
		} else {
			console.error('error plugin', details)//only the user can see this, but often the user is staff
			pageStore.errorDetails = details//save the detains in the store for error2 to retrieve it
			showError({//cause the fatal error state, stopping the whole page, and rendering the simple error.vue
				status: 400,//status code required, even though there's no HTTP; using 400 malformed request to mark an error entirely on the page
				statusText: 'Page error',
			})
		}
		//on the client, also return nothing; we called show error to put the page into the error.vue fatal error state
	}
}
