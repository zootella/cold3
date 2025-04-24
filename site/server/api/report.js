//./server/api/report.js

import {
stringo, headerGetOne, browserToUser, recordHit, recordDelay,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['PageError.', 'Hello.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, headers, browserHash}) {
	/*
	ttd april, no,  you can't unify them
	error is using turnstile (you have to turn that on here)
	and hello really can't. so you'll have to separate them, or turn off turnstile for error, ugh

	or, you could manually check the turnstile token  here
	or somethign weirder where you require the token on a whole endpoint, or on an action that ends Turnstile.
	so then it's PageErrorTurnstile.
	yeah, it's whacky, but you kinda like that, actually
	*/

	let r = {
		page: {//(1) information script on the page is telling us; least trustworthy
			sticker:     body.sticker,
			graphics:    body.graphics,
			details:     body.details,//error details the untrusted page is reporting; the point of all of this
			detailsText: body.detailsText,//called look on page because details.error stringifies to {}
		},
		browser: {//(2) information the browser is telling us; more trustworthy
			agent: headerGetOne(headers, 'user-agent'),
			browserHash,
			user: await browserToUser({browserHash}),//look up what user is signed in to this browser
		},
		worker: {//(3) information cloudflare is telling us; trustworthy
			sticker: Sticker().all,
			//these headers are set by the cloudflare worker, more trusted than information from page script
			ip: headerGetOne(headers, 'cf-connecting-ip'),//returns undefined so stringification will omit the property!
			geography: {
				country: headerGetOne(headers, 'cf-ipcountry'),//this one is always present
				city:    headerGetOne(headers, 'cf-ipcity'),//remaining ones are sometimes present
				region:  headerGetOne(headers, 'cf-region-code'),
				postal:  headerGetOne(headers, 'cf-postal-code'),
			},
		},
	}

	let task = Task({name: 'report api'})
	if (action == 'PageError.') {

		await awaitLogAlert('reported page error', r)

	} else if (action == 'Hello.') {

		await recordHit({
			origin: door.origin,
			browserHash,
			userTag: toTextOrBlank(r.browser.user.userTag),
			ipText: toTextOrBlank(r.worker.ip),
			geographyText: stringo(r.worker.geography),
			browserText: stringo({agent: r.browser.agent, ...r.page.graphics}),//agent is from the browser, graphics renderer and vendor is from the page
		})

		await recordDelay({
			task: 'Hello.',
			d1: body.d1,//page duration
			d2: body.d2,//within that, server duration
			d3: -1, d4: -1, d5: -1,//the delay table has room to grow
			origin: door.origin,
			browserHash,
			userTag: toTextOrBlank(r.browser.user.userTag),
			ipText: toTextOrBlank(r.worker.ip),
		})

		//trying to do things like the above two in parallel with keepPromise, you were getting 4s delays on the page, "gave up waiting" errors in datadog, and 409 (Conflict) errors in supabase dashboard logs. so, you're going to do things one at a time from now on. but still, this is worrysome
	}
	task.finish({success: true})
	return task
}
