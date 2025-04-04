
//this file is ./plugins/plugin1.js

import {
Sticker, log, look, Now, Tag, getBrowserTag, checkText, hasText, awaitDog,
getBrowserGraphics, awaitLogAlert,
} from 'icarus'

//runs once on the server when a new browser tab GETs, and once again in that browser tab; doesn't run as the user clicks from route to route in the tab, nor when a component POSTs back to an api endpoint
export default defineNuxtPlugin(async (nuxtApp) => {
	try {
		try {
			await pluginProcessBelow({nuxtApp})
		} catch (e2) { await awaitLogAlert('plugin', {e2}); throw e2 }//log the error, but let it throw upwards to stop things!
	} catch (e3) { console.error('[OUTER]', e3); throw e3 }
})

async function pluginProcessBelow({nuxtApp}) {

	/*
	const helloStore = useHelloStore()
	await helloStore.hello1()
	//now the hello store knows if there is a user at this browser or not
	//components asking hello store will get that answer right away
	//and so now, you can let the page build
	helloStore.hello2()//returns a promise we're intentionally not awaiting!
	//also once per new tab, do hello2
	//but do this in the background, don't delay components for it
	*/


	const helloStore = useHelloStore()
	await helloStore.hello1()//$fetch-es to /api/hello1 on first call, does not do that on later calls
	//await hello1, as a whole bunch of components will render depending on helloStore.userTag or not
	//but don't await this one, just get it started now, when the page hits a new tab, and let it happen in a moment after there are already components on the page
	/*no await*/helloStore.hello2()

	/*
	let hits = helloStore.hits


	//on the client: browser graphics

	//on the client: browser tag
	let browserTag = getBrowserTag()
	helloStore._browserTag = browserTag

	let browserGraphics = getBrowserGraphics()
	helloStore._browserGraphics = browserGraphics

	log(`hi from plugin1.js witih process.client at ${Sticker().all}, called helloStore to get hits ${hits}, and knows our browser tag ${browserTag}`)
*/


}
