
import {
headerGetOne, stringo,
recordHit, browserToUser,
browserToCodes,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserTag}) {
	let r = {}
	r.sticker = Sticker().all

	//from the browser tag, look up user tag, and information about the user like route and name
	r.user = await browserToUser({browserTag})//in here is browserTag, userTag, and names and routes like name.formFormal

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
			//ttd april, here's where you can add back renderer and vendor; and maybe reorganize into .page, .browser, .worker, matching error.js, also
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

	return r
}
