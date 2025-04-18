// ./server/plugins/serverPlugin1Error.js

import {
siteError,
} from 'icarus'
import {defineNitroErrorHandler} from 'nitropack/runtime'

export default defineNitroErrorHandler(async (error, event) => {
	if (error instanceof Error) {//otherwise other stuff runs through here, freaking us out
		return await siteError({source: 'Nitro.', error, event})
	}
})










/*
chat suggests:

export default defineNuxtPlugin(() => {
defineNitroErrorHandler(async (error, event) => {
await siteError({ source: 'Nitro', error, event })
})
})
*/







