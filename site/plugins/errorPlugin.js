// ./plugins/errorPlugin.js

export default defineNuxtPlugin(async (nuxtApp) => {

	/*
	errors; summary of findings and decisions:
	- you can't catch errors on the margin; nuxt won't build
	- you can't catch every error; the seams where the platform and framework parts come together are too numerous and arcane
	- remember that while api endpoints only run on the server, plugins, stores, and components run both places
	- we're treating exceptions as truly exceptional: the page should interrupt the user, going full error; datadog should wake up staff on pager duty
	- on the server, we can log to datadog directly; on the client, we can post to a logger, protected by a button click and turnstile
	- an error anywhre in the three layer stack should go up to the page, both posting to datadog and making the page full error
	*/

	/*
	errorspot
	four variations to explore:
	1 no handlers registered
	2 handlers registered that take no action
	3 handlers registered that bubble up
	4 handlers registered that take over
	*/

	if (false) {//turn on handler registration
		//Vue's native error handler catches rendering and lifecycle errors.
		nuxtApp.vueApp.config.errorHandler = (error, instance, info) => { passError({source: 'Vue.', error, instance, info}) }
		//Nuxt's app:error hook catches broader application errors, such as during SSR or plugin initialization)
		nuxtApp.hook('app:error', async (error) => { await passError({source: 'Nuxt.', error}) })//we can't use async await in first one
	}

	//errorspot, also make an errorspot within these plugins that run at the start of every server GET or POST, and also every new tab navigation

	//weour requirement here is 
	async function passError(details) {

		log('pass error got: 🚧🚧🚧', look({details}))
		/*
		let {error} = details

		if (error._alreadyHandled) return
		error._alreadyHandled = true//mark so we skip it if we see it here again!

		if (process.server) {

			//log the error to datadog
			try {
				await awaitLogAlert()
			} catch (e) { console.error() }

			//now, we have to do the same things that nuxt would do before we added this handler! we want errors to bubble up to the error page the same way!!

			//set the error in the same way, without this handler, it would bubble up, giving theh user the error.vue experience in the browser
			if (nuxtApp.ssrContext && !nuxtApp.ssrContext.error) {
				nuxtApp.ssrContext.error = {
					statusCode: error.statusCode || 500,
					message: error.message || 'Internal Server Error',
				}
			}

		} else if (process.client) {

			//log the error to the browser developer tools console
			console.error()

			//now, we have to do the same things that nuxt would do before we added this handler! we want errors to bubble up to the error page the same way!!

			// Save the error to a global state; error.vue will be able to get it from there
			const globalError = useState('globalError', () => null)//function provides default value, null
			if (!globalError.value) {
				globalError.value = createError({
					statusCode: error.statusCode || 400,//we're using this alternative existing HTTP response code for exceptions from page code
					message: error.message || 'Bad Request',
				})
			}

			// Navigate to the error page so that the view switches immediately
			navigateTo('/error')
		}
		*/
	}
})
