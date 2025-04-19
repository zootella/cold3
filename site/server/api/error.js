//./server/api/error.js

import {
headerGetOne, browserToUser,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let headers = door?.workerEvent?.req?.headers//headers from worker
	let browserTag = body.browserTag//browser tag from browser cookie, more trusted than page
	let report = {}

	//(1) information script on the page is telling us; least trustworthy
	report.page = {
		errors:   body.errors,//the errors the untrusted page is reporting; the point of all of this
		graphics: body.graphics,
		sticker:  body.sticker,
	}

	//(2) information the browser is telling us; more trustworthy
	report.browser = {
		agent: headerGetOne(headers, 'user-agent'),
		user: await browserToUser({browserTag}),//look up what user is signed in to this browser
	}
	report.browser.user.browserTag = browserTag//put the browser tag in the user object; careful to never do this in an object that could go back to the page!

	//(3) information cloudflare is telling us; trustworthy
	report.worker = {
		sticker:   Sticker().all,
		//these headers are set by the cloudflare worker, more trusted than information from page script
		ipAddress: headerGetOne(headers, 'cf-connecting-ip'),//returns undefined so stringification will omit the property!
		geography: {
			country: headerGetOne(headers, 'cf-ipcountry'),//this one is always present
			city:    headerGetOne(headers, 'cf-ipcity'),//remaining ones are sometimes present
			region:  headerGetOne(headers, 'cf-region-code'),
			postal:  headerGetOne(headers, 'cf-postal-code'),
		},
	}

	let task = Task({name: 'error api'})
	if (isCloud()) {
		await awaitLogAlert('reported page error', report)
	} else {
		log('cloud would report page error', look(report))//running locally, see what cloud would report to datadog
	}
	task.finish({success: true})
	return task
}
