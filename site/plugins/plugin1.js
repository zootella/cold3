
//this file is ./plugins/plugin1.js

import {
Sticker, log, look, Now, Tag, getBrowserTag, checkText, hasText, awaitDog,
getBrowserGraphics,
} from 'icarus'
import {useStore1} from '~/stores/store1'

//runs once on the server when a new browser tab GETs, and once again in that browser tab; doesn't run as the user clicks from route to route in the tab, nor when a component POSTs back to an api endpoint
export default defineNuxtPlugin(async (nuxtApp) => {
	//ttd january, try catch whole thing to function below; log as alert but then rethrow to stop the load!

	const store1 = useStore1()
	await store1.getHits()//$fetch-es to /api/hit on first call, does not do that on later calls
	let hits = store1.hits

	if (process.server) {

		let ipAddress, userAgent
		let o = useRequestEvent()?.req?.headers
		if (o) {
			ipAddress = o['cf-connecting-ip']
			userAgent = o['user-agent']
		}

		store1._ipAddressOnLoad = ipAddress
		store1._userAgentOnLoad = userAgent

		log(`hi from plugin1.js with process.server at ${Sticker().all}, called store1 to get hits ${hits}, and here we know our trusted ip address: "${ipAddress}"`)

	} else if (process.client) {

		//on the client: browser graphics

		//on the client: browser tag
		let browserTag = getBrowserTag()
		store1._browserTag = browserTag

		let browserGraphics = getBrowserGraphics()
		store1._browserGraphics = browserGraphics

		log(`hi from plugin1.js witih process.client at ${Sticker().all}, called store1 to get hits ${hits}, and knows our browser tag ${browserTag}`)

	}


})




