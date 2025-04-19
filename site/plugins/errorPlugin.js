// ./plugins/errorPlugin.js

import {
unloop,
} from 'icarus'

export default defineNuxtPlugin((nuxtApp) => {

	//Gets failures during SSR, plugin initialization, and the very first hydrate/mount on the client
	nuxtApp.hook('app:error', async (error) => {//runs on server and client
		await processError({source: 'Nuxt.', error})
		//return nothing, and let Nuxt carry on to show error.vue
	})

	//Gets errors within render functions, lifecycle hooks, setup, watchers, event handlers, and so on
	nuxtApp.hook('vue:error', async (error, instance, info) => {//runs on server and client
		await processError({source: 'Vue.', error, instance, info})
		//no rethrow or return, Nuxt will render error.vue
	})
})

async function processError(details) {
	log(`🚧 🚧 🚧 🚧 🚧 ${Sticker().all}`)
	if (process.server) {
		/*
		on the server, we need to:
		1[x]log the error to datadog, giving datadog complete information
		2[x]cause the server to respond to this request (which might be a very first GET, or an api fetch POST) with a response that will cause the page to render the error.vue component (cause the page to interrupt the user fully, and go full error)
		3[x]set the return (or throw) appropriately, as per documented api use for nuxt 3
		*/
		try {
			await awaitLogAlert('error plugin', details)//log the error to datadog, including all details
		} catch (e) { console.error('[OUTER]', e, details) }//if that process failed as well, fall back to standard error

	} else if (process.client) {
		/*
		on the client, we need to:
		4[x]log the error to the browser console (we can't log to datadog from the page directly)
		5[x]interrupt the whole page, switching everything to error.vue. not sure if we do this by throwing, navigating, or some other method
		6[]get information about this error somewhere so the error.vue component can get to it (so it can display a summary on the page, essentially)
		7[]set the return (or throw) appropriately, as per documented api use for nuxt 3
		*/
		console.error('error plugin', details)//only the user can see this, but sometimes the user is staff

		const errorStore = useErrorStore()
		errorStore.add(details)

		/*
		let currentError = useError()
		if (!currentError.value) showError({statusCode: 400, statusMessage: 'Page error', data: details})
		*/

		/*
		also, in this, ill be interested to see if the route changes to an error route, or stays the same, even if the page is taken over with an error component
		and, how the error component includes or does not include the outer parts of the layout, like the navigation links
		*/
	}
}
