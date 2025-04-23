//./server/api/report.js

import {
headerGetOne, browserToUser, recordHit,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['PageError.', 'Hello.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, headers, browserHash}) {

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
	log('hi from report api', look(r), look({action, body}))

	let task = Task({name: 'report api'})
	if (action == 'PageError.') {
		await awaitLogAlert('reported page error', r)
	} else if (action == 'Hello.' && isCloud()) {
		await recordHit({
			origin: door.origin,
			browserHash,
			userTag: toTextOrBlank(r.browser.user.userTag),
			ipText: toTextOrBlank(r.worker.ip),
			geographyText: stringo(r.worker.geography),
			browserText: stringo({agent: r.browser.agent, ...graphics}),//agent is from the browser, graphics renderer and vendor is from the page
		})
	}
	task.finish({success: true})
	return task
}
