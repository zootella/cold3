//./server/api/hit.js

import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
settingReadInt, settingWrite,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	/*
	here we are in a standard nuxt api endpoint
	i should note, this project was created by cloudflare create, and uses nuxt with cloudflare to develop locally with cloudflare wrangler, and deploy to cloudflare pages and workers
	ok, so here in this file, i am passed workerEvent, and also
	useRuntimeConfig, setResponseStatus, are defined
	and $fetch is also defined
	these are imported somehow, for me

	but, if code here calls into a library file
	useRuntimeConfig and setResponseStatus are *not* defined any longer

	curiously, $fetch is defined in this deeper external file

	im intersetd to know how nuxt and nitro are doing this
	*/
	log('hi in endpoint:', look({sample1, spelunk: workerEvent.context.note1}))

	return await doorWorker('POST', {actions: ['Get.', 'Increment.'], workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}
	r.sticker = Sticker().all





	let h = await settingReadInt('hits', 0)

	if (action == 'Get.') {
	} else if (action == 'Increment.') {
		h++
		await settingWrite('hits', h)
	}

	r.hits = h
	return r
}
