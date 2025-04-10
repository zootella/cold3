
import {
settingReadInt, settingWrite, headerGetOne, hashText, parse, stringo,
recordHit, browserToUser,
browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body}) {
	let r = {}
	r.sticker = Sticker().all//below, stay mindful of the awaits--each one costs us ~150ms!

	//from the browser tag, look up user tag, and information about the user like route and name
	let browserTag = body.browserTag; checkTag(browserTag)
	r.user = await browserToUser({browserTag})//in here is browserTag, userTag, and names and routes like name.formFormal

	//get information from cloudflare about the headers, you'll use these for (1) sudo access and (2) hit log, ttd march
	let h = door?.workerEvent?.req?.headers
	r.connection = {
		ipAddress: headerGetOne(h, 'cf-connecting-ip'),//returns undefined so stringification will omit the property!
		geography: {
			country: headerGetOne(h, 'cf-ipcountry'),//this one is always present
			city:    headerGetOne(h, 'cf-ipcity'),//remaining ones are sometimes present
			region:  headerGetOne(h, 'cf-region-code'),
			postal:  headerGetOne(h, 'cf-postal-code'),
		},
		browser: {
			agent:   headerGetOne(h, 'user-agent'),//what the browser told cloudflare
			renderer: body.browserGraphics.renderer,//what the browser reported from code
			vendor:   body.browserGraphics.vendor,
		},
	}

	//record the hit
	if (isCloud({uncertain: 'Cloud.'})) {
		await recordHit({
			origin: door.origin,
			browserTag,
			userTag: toTextOrBlank(r.user.userTag),//we can't do this first because we need the user tag
			ipText: toTextOrBlank(r.connection.ipAddress),
			geographyText: stringo(r.connection.geography),
			browserText: stringo(r.connection.browser),
		})
	}
	//ttd march, trying to do things in parallel with keepPromise, you were getting 4s delays on the page, "gave up waiting" errors in datadog, and 409 (Conflict) errors in supabase dashboard logs. so, you're going to do things one at a time from now on. but still, this is worrysome

	//check if this browser is expecting any codes
	r.codes = await browserToCodes({browserTag})

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
