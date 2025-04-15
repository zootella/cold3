//./plugins/errorPlugin2.client.js

/*
export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
		//you've observed a mistake in a computed property function lead here
		log('error handler 1', look({error, instance, info}))

		//chat is telling me the right way to get the page to error.vue is to throw createError:
		throw createError({statusCode: 400, source: 'Handler.', error, instance, info, message: 'A runtime error occurred.' })
	}
	nuxtApp.hook('vue:error', (error, instance, info) => {
		//you've observed mistakes in watch and click handlers lead here
		log('error handler 2', look({error, instance, info}))

		//chat is telling me throwing here could create an infinite loop, and instead this will get the page to error.vue:
		useError().value = createError({statusCode: 400, source: 'Hook.', error, instance, info, message: 'A runtime error occurred.' })
	})
})
*/

	/*
	ttd april, three more that you're not going to start out with, as they could freak out unnecessarily

	const router = useRouter()
	router.onError((error) => {
		log('error handler 3', look({error}))
		nuxtApp.error({statusCode: 400, source: 'Router.', error, message: 'A routing error occurred.'})
	})
	window.addEventListener('error', (event) => {
		log('error handler 4', look({event}))
		nuxtApp.error({statusCode: 400, source: 'ScriptError.', event, message: 'A runtime error occurred.' })
	})
	window.addEventListener('unhandledrejection', (event) => {
		log('error handler 5', look({event}))
		nuxtApp.error({statusCode: 400, source: 'ScriptPromise.', event, message: 'An unhandled promise rejection occurred.' })
	})
	*/
