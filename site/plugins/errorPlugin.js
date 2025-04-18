// ./plugins/errorPlugin.js

export default defineNuxtPlugin((nuxtApp) => {

	//Gets failures during SSR, plugin initialization, and the very first hydrate/mount on the client
	nuxtApp.hook('app:error', async (error) => {//runs on server and client
		return await processError({source: 'Nuxt.', error})
		//return nothing, and let Nuxt carry on to show error.vue
	})

	//Gets errors within render functions, lifecycle hooks, setup, watchers, event handlers, and so on
	nuxtApp.hook('vue:error', async (error, instance, info) => {//runs on server and client
		return await processError({source: 'Vue.', error, instance, info})
		//no rethrow or return, Nuxt will render error.vue
	})
})

export async function processError(details) {
	let s = `🚧 🚧 🚧 🚧 🚧 ${Sticker().all} `
	if      (defined(typeof process) && process.server) s += 'process.server'
	else if (defined(typeof process) && process.client) s += 'process.client'
	else s += 'PROCESS OTHER OR NOT DEFINED'
	log(s, look(details))

	if (process.server) {
		/*
		on the server, we need to:
		- [x]log the error to datadog, giving datadog complete information
		- []cause the server to respond to this request (which might be a very first GET, or an api fetch POST) with a response that will cause the page to render the error.vue component (cause the page to interrupt the user fully, and go full error)
		- []set the return (or throw) appropriately, as per documented api use for nuxt 3
		*/
		try {
			await awaitLogAlert('error plugin', details)//log the error to datadog, including all details
		} catch (e) { console.error('[OUTER]', 'error plugin', e, details) }//if that process failed as well, fall back to standard error

	} else if (process.client) {
		/*
		on the client, we need to:
		- []log the error to the browser console (we can't log to datadog from the page directly)
		- []interrupt the whole page, switching everything to error.vue. not sure if we do this by throwing, navigating, or some other method
		- []get information about this error somewhere so the error.vue component can get to it (so it can display a summary on the page, essentially)
		- []set the return (or throw) appropriately, as per documented api use for nuxt 3

		also, in this, ill be interested to see if the route changes to an error route, or stays the same, even if the page is taken over with an error component
		and, how the error component includes or does not include the outer parts of the layout, like the navigation links
		*/
	}
}


























