
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


/*
ttd february
figured out today 2025feb4:

-plugin1.server.js would have nothing to do, you can omit it
-plugin2.client.js could get the browser tag, get store1 going, which POSTs to /api/hi1, find out the user name signed in, and then render either the brochure or the feed--all this is always necessary, and must be very fast (single supabase query)

/api/hi1

must be really fast, single query

sends
- browser tag

server does
- tells if a user is signed in or not, only

/api/hi2

can be slower, happens in background of loaded components

sends
- browser tag
- opengl renderer and vendor

server does
- tells what user is signed in, just like hi1 did
- registers a hit with information, maybe do that with a door promise off to the side, even
- gets the user name
- figures out if they're within a super permissions hour
- figures out if they're a creator or just a user, staff, anon user, their role, essentially

done this way, h1 and h2 both happen only once each time a new tab first goes to the site
not again as the user clicks around
hi1 is as fast as possible to choose the right components to load
hi2 can be slower and work in the background while the user is already looking over the site
*/



/*
ttd february

today you added plugins
[]also add layouts
they're not a part of the data flow, but they may be useful
like you might have layouts for

machine, like ping
legal, like minimal terms
brochure, no user is signe din yet
panel
feed




*/





















