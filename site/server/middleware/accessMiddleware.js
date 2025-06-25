//./server/middleware/accessMiddleware.js

export default defineEventHandler((workerEvent) => {//middleware lets us see the event object before Nuxt calls the specific handler
	accessKey(workerEvent?.context?.cloudflare?.env)//save the secret from the dashboard in a module variable for getAccess() to use
})
