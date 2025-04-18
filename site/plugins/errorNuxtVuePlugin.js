// ./plugins/errorPlugin.js

import {
siteError,
} from 'icarus'

export default defineNuxtPlugin((nuxtApp) => {

	//2 of 3: Nuxt error hook: Catches failures during SSR, plugin initialization, and the very first hydrate/mount on the client
	nuxtApp.hook('app:error', async (error) => {//runs on server and client
		await siteError({source: 'Nuxt.', error})
		//return nothing, and let Nuxt carry on to show error.vue
	})

	//3 of 3: Nuxt hook for Vue errors: Catches errors within render functions, lifecycle hooks, setup, watchers, event handlers, and so on
	nuxtApp.hook('vue:error', async (error, instance, info) => {//runs on server and client
		await siteError({source: 'Vue.', error, instance, info})
		//no rethrow or return, Nuxt will render error.vue
	})
	/*
	notes about choosing vue:error rather than nuxtApp.vueApp.config.errorHandler
	- vue:error supports async; errorHandler does not
	- error propegation is better: with errorHandler Vue considers the error handled;
	we would have to rethrow it to lead things to error.vue
	returning nothing from vue:error keeps things on the path to error.vue, which is what we want

	the other method looked like this:
	nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
		siteError({source: 'Vue.', error, instance, info})//can't await here
		throw error//must rethrow here
	}
	*/
})
