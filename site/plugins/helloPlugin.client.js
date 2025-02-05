
//this file is ./plugins/plugin1.js

import {
Sticker, log, look, Now, Tag, getBrowserTag, checkText, hasText, awaitDog,
getBrowserGraphics, awaitLogAlert,
} from 'icarus'
import {useStore1} from '~/stores/store1'

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


	const store1 = useStore1()
	await store1.getHits()//$fetch-es to /api/hit on first call, does not do that on later calls
	let hits = store1.hits


	//on the client: browser graphics

	//on the client: browser tag
	let browserTag = getBrowserTag()
	store1._browserTag = browserTag

	let browserGraphics = getBrowserGraphics()
	store1._browserGraphics = browserGraphics

	log(`hi from plugin1.js witih process.client at ${Sticker().all}, called store1 to get hits ${hits}, and knows our browser tag ${browserTag}`)



}
