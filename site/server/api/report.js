
import {
headerGetOne, isPlain, credentialBrowserGet, recordHit, recordDelay,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['PageErrorTurnstile.', 'Hello.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, headers, browserHash}) {
	let r = {//assemble an object of what we know, categorized by the source of the information, and keeping in mind its trustworthyness
		page: {//source (1) page: information script on the page is telling us; least trustworthy
			sticker:  body.sticker,
			graphics: body.graphics,
			details:  body.details,//error details the untrusted page is reporting; the point of all of this
		},
		browser: {//source (2) browser: information the browser is telling us; more trustworthy
			agent: door.browser.agent,//the door read the header
			browserHash,
			user: await credentialBrowserGet({browserHash}),//look up what user is signed in to this browser
		},
		worker: {//source (3) worker: information cloudflare is telling us; trustworthy, and the door already read it from the headers
			sticker: Sticker(),
			ip: door.ip,
			geography: door.geography,
		},
	}

	if (action == 'PageErrorTurnstile.') {

		await awaitLogAlert('reported page error', r)

	} else if (action == 'Hello.') {

		await recordHit({//the origin, ip, geography, and agent ride on the door above, so the hit names only what the page told us
			browserHash,
			userTag: toTextOrBlank(r.browser.user?.userTag),
			graphics: isPlain(r.page.graphics) ? r.page.graphics : {},//the renderer and vendor, the page's word; the body is untrusted, and a post without them records a hit that knows less rather than failing
		})

		await recordDelay({
			task: 'Hello.',
			d1: body.d1,//page duration
			d2: body.d2,//within that, server duration
			d3: -1, d4: -1, d5: -1,//the delay table has room to grow
			origin: door.origin,
			browserHash,
			userTag: toTextOrBlank(r.browser.user?.userTag),
			ipText: toTextOrBlank(r.worker.ip),
		})

		//trying to do things like the above two in parallel with keepPromise, you were getting 4s delays on the page, "gave up waiting" errors in datadog, and 409 (Conflict) errors in supabase dashboard logs. so, you're going to do things one at a time from now on. but still, this is worrysome
	}
	return {success: true}
}
