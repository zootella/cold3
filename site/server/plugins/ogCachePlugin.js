
/*
The store side of the og:image edge cache. middleware10 checks for cache hits; this plugin
hooks Nitro's beforeResponse to store cache misses after nuxt-og-image renders them.

beforeResponse gives us response.body — the raw Buffer returned by nuxt-og-image's handler —
and the response headers (cache-control, etag, etc.) are already set on the event by the
module's cache.js. We build a Response from both and cache.put() it for next time.
*/
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('beforeResponse', (event, response) => {

		if (!event.context._ogCacheKey) return//not an og:image cache miss; middleware10 didn't flag this
		if (!response?.body) return//no body to cache (shouldn't happen, but be safe)
		if (!(typeof caches != 'undefined' && caches.default)) return

		try {

			let headers = {}
			for (let k of ['content-type', 'cache-control', 'etag', 'last-modified', 'vary']) {
				let v = getResponseHeader(event, k)
				if (v) headers[k] = v
			}

			//response.body is the raw Buffer (extends Uint8Array) from nuxt-og-image's renderer
			let body = new Uint8Array(response.body)//copy; safe even if the Buffer is a slice of a larger slab
			let store = caches.default.put(event.context._ogCacheKey, new Response(body, { headers }))

			let context = event.context.cloudflare?.context
			if (context) context.waitUntil(store)//non-blocking; response is already on its way to the client

		} catch {}//don't break the response if cache storage fails
	})
})
