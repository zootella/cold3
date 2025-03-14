
import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker, keep,
checkTag, settingReadInt, settingWrite, headerGetOne, hashText, parse, print,
isCloud, hasText, recordHit, demonstrationSignGet,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	let browserTag = body.browserTag
	checkTag(browserTag)

	let d = await demonstrationSignGet({browserTag})
	let userTag = d.userTag
	let routeText = d.nameFormal

	let h = door?.workerEvent?.req?.headers
	r = {
		browserTag: body.browserTag,
		browserGraphics: body.browserGraphics,

		ipAddress: headerGetOne(h, 'cf-connecting-ip'),
		userAgent: headerGetOne(h, 'user-agent'),
		geoCountry: headerGetOne(h, 'cf-ipcountry'),
		//above headers should always be there; below ones are sometimes there
		geoCity: headerGetOne(h, 'cf-ipcity'),
		geoRegion: headerGetOne(h, 'cf-region-code'),
		geoPostal: headerGetOne(h, 'cf-postal-code'),
		//you'll use these for (1) sudo access and (2) hit log

		sticker: Sticker().all,
		userTag: userTag,
		userName: routeText,
	}

//	log('hi from hello2', look(r))

	//now as a time test, let's hash some stuff
	let o = {
		browser: browserTag,
		user: userTag,
		ip: r.ipAddress,
		agent: r.userAgent,
		renderer: body.browserGraphics.renderer,
		vendor: body.browserGraphics.vendor,
	}
	let s = print(o)
	let t = Now()
	let v = await hashText(s)
	r.hashPlain = s
	r.hashValue = v
	r.hashDuration = Now() - t//getting 0ms hash duration, which is great

	//and next we'll record the hit in the database
	let g = {}
	if (hasText(r.geoCountry)) g.country = r.geoCountry
	if (hasText(r.geoCity))    g.city    = r.geoCity
	if (hasText(r.geoRegion))  g.region  = r.geoRegion
	if (hasText(r.geoPostal))  g.postal  = r.geoPostal
	let b = {
		agent: r.userAgent,
		renderer: body.browserGraphics.renderer,
		vendor: body.browserGraphics.vendor,
	}
	if (isCloud({uncertain: 'Cloud.'})) {
		keep(recordHit({
			browserTag,
			userTag: hasText(userTag) ? userTag : '',
			ipText: r.ipAddress,
			geographyText: print(g),
			browserText: print(b),
		}))
	}
	//ttd march actually do this as early as you can because keep() makes it parallelized, and that's not any faster if you do it at the end!


	/*
	/api/hello2

	taking more time, give a new tab more information from is browserTag and graphics hardware
	like the user name
	stage of teh user, like anonymous, current, suspended, closed
	permission level of the user, like signed in normally, signed in for an hour of advanced permissions
	creator or not

	also log a hit, the quarter day unique rows in hit_table
	browser tag, from body
	graphics hardware, from body
	user agent string, from headers, so these are less trustworthy
	geography, from cloudflare
	ip address, from cloudflare
	tick now, from cloudflare, so these are more trustworthy

	hello2 can take more time because the page is running now with loading components while we get this info in parallel


		let data = await $fetch('/api/hello2', {method: 'POST', body: {
		}})
		sticker2.value = data.sticker
		userTag.value = data.userTag
		userName.value = data.userName
	*/


	return r
}
