
import {
headerGetOne, stringo,
recordHit, browserToUser,
browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserTag: cookieTag}) {
	let r = {}
	r.sticker = Sticker().all//below, stay mindful of the awaits--each one costs us ~150ms!

	//from the browser tag, look up user tag, and information about the user like route and name
	let browserTag = body.browserTag; checkTag(browserTag)
	r.user = await browserToUser({browserTag})//in here is browserTag, userTag, and names and routes like name.formFormal
	r.cookieTag = cookieTag//ttd april, rough before moving browser tag to cookie and keeping it away from the page; you could hash it to show the hash to the page for testing, for example

	//get information from cloudflare about the headers, you'll use these for (1) sudo access and (2) hit log, ttd march
	r.connection = {
		ipAddress: headerGetOne(headers, 'cf-connecting-ip'),//returns undefined so stringification will omit the property!
		geography: {
			country: headerGetOne(headers, 'cf-ipcountry'),//this one is always present
			city:    headerGetOne(headers, 'cf-ipcity'),//remaining ones are sometimes present
			region:  headerGetOne(headers, 'cf-region-code'),
			postal:  headerGetOne(headers, 'cf-postal-code'),
		},
		browser: {
			agent:   headerGetOne(headers, 'user-agent'),//what the browser told cloudflare
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
	//ttd april, you should factor the above block into a function in level3 which you give the headers

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
