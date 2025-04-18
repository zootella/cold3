// ./plugins/errorNitroPlugin.js

import {
siteError,
} from 'icarus'

//1 of 3: Nitro error handler: Catches any exception thrown in Nitro lifecycle and server‑side API routes
export default defineNitroErrorHandler(async (error, event) => {//only runs on server
	await siteError({source: 'Nitro.', error, event})
	//return nothing, and Nitro will continue to render its default error response
})
