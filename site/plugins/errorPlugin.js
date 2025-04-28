//./plugins/errorPlugin.js

export default defineNuxtPlugin((nuxtApp) => {

	//Gets failures during SSR, plugin initialization, and the very first hydrate/mount on the client
	nuxtApp.hook('app:error', async (error) => {
		return await handleError({source: 'Nuxt.', error})
	})

	//Gets errors within render functions, lifecycle hooks, setup, watchers, event handlers, and so on
	nuxtApp.hook('vue:error', async (error, instance, info) => {
		return await handleError({source: 'Vue.', error, instance, info})
	})
})

async function handleError(details) {
	log(`🚧 🚧 🚧 🚧 🚧 ${Sticker().all} "${details?.error?.message}"`)//ttd april, remove this line when errors have settled down!
	if (process.server) {
		try {
			await awaitLogAlert('error plugin', details)//log the error to datadog, including all details
		} catch (e) { console.error('[OUTER]', e, details) }//catch an error trying to log the first one; fall back to standard error
		//on the server, return nothing; the response puts the page into the error.vue state
	} else if (process.client) {
		const pageStore = usePageStore()//use the error store to save a single error, and only call showError once
		if (pageStore.errorDetails) {
			log('already put page in error state, doing nothing with:', look(details))
		} else {
			console.error('error plugin', details)//only the user can see this, but often the user is staff
			pageStore.errorDetails = details//save the detains in the store for error2 to retrieve it
			showError({//cause the fatal error state, stopping the whole page, and rendering the simple error.vue
				statusCode: 400,//status code required, even though there's no HTTP; using 400 malformed request to mark an error entirely on the page
				statusMessage: 'Page error',
			})
		}
		//on the client, also return nothing; we called show error to put the page into the error.vue fatal error state
	}
}
