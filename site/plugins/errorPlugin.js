// ./plugins/errorPlugin.js

export default defineNuxtPlugin((nuxtApp) => {

	//Gets failures during SSR, plugin initialization, and the very first hydrate/mount on the client
	nuxtApp.hook('app:error', async (error) => {//runs on server and client
		return await handleError({source: 'Nuxt.', error})
	})

	//Gets errors within render functions, lifecycle hooks, setup, watchers, event handlers, and so on
	nuxtApp.hook('vue:error', async (error, instance, info) => {//runs on server and client
		return await handleError({source: 'Vue.', error, instance, info})
	})
})

async function handleError(details) {
	log(`🚧 🚧 🚧 🚧 🚧 ${Sticker().all}`)//ttd april, remove this line when errors have settled down!
	if (process.server) {
		try {
			await awaitLogAlert('error plugin', details)//log the error to datadog, including all details
		} catch (e) { console.error('[OUTER]', e, details) }//if that process failed as well, fall back to standard error
		//on the server, return nothing; the response puts the page into the error.vue fatal error state
	} else if (process.client) {
		if (useError().value) {
			log('page already in error state, doing nothing with:', look(details))
		} else {
			console.error('error plugin', details)//only the user can see this, but sometimes the user is staff
			const errorStore = useErrorStore(); errorStore.add(details)//save the error where error2 will be able to get it
			showError({//cause the fatal error state, stopping the whole page, and rendering the simple error.vue
				statusCode: 400,//show error wants a status code, even though there's no contact wtih the server; we're using 400 Bad Request like the page error could lead to a malformed request
				statusMessage: 'Page error',
			})
		}
		//on the client, also return nothing; we called show error to put the page into the error.vue fatal error state
	}
}
