
import { log, inspect, toss } from '../../library/library0.js'
import {  } from '../../library/library1.js'

export default defineEventHandler(async (event) => {
	let o = {}
	try {

		let body = await readBody(event)
		log('body is:', inspect(body))
		console.log(body.message)

		await serverSnippet(body.message)

		o.message = 'hi from api log'
		o.mirroredBody = body



		setResponseStatus(event, 200)
	} catch (e) {
		log('count caught: ', e)
		setResponseStatus(event, 500)
	}
	return o;
})




async function serverSnippet(s) {
	log(`server snippet got "${s}", edit10`)

	clog(s)



}


async function clog(...a) {//cloud log
	let display = log(a)
	let response
	response = await logToDatadog(display);    log('[1] datadog response:',    inspect(response))
	response = await logToPapertrail(display); log('[2] papertrail response:', inspect(response))
	response = await logToLogflare(display);   log('[3] logflare response:',   inspect(response))
	response = await logToSumoLogic(display);  log('[4] sumologic response:',  inspect(response))
}



//cloud logging roundup!
/*
datadoghq.com
no free, $0.10/month
47k x followers

in the dashboard, toplevel, Logs, Explorer, then scroll down a little
*/
async function logToDatadog(message) {
	return await fetch(process.env.ACCESS_DATADOG_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'DD-API-KEY': process.env.ACCESS_DATADOG_API_KEY
		},
		body: JSON.stringify({
			message: message,
			ddsource: 'lambda-and-workers',
			ddtags: 'env:production'
		})
	})
}
/*
papertrail.com by solarwinds
free tier, then $7/month first paid tier
4k followers
*/
async function logToPapertrail(message) {
	return await fetch(process.env.ACCESS_PAPERTRAIL_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-PAPERTRAIL-TOKEN': process.env.ACCESS_PAPERTRAIL_TOKEN
		},
		body: JSON.stringify({
			message: message
		})
	})
}
/*
logflare.app by cloudflare
free tier, then $15/month first paid tier
5 followers












*/
async function logToLogflare(message) {
	return await fetch(
		process.env.ACCESS_LOGFLARE_ENDPOINT+
		'?source='+
		process.env.ACCESS_LOGFLARE_SOURCE_ID,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': process.env.ACCESS_LOGFLARE_API_KEY
			},
			body: JSON.stringify({
				message: message
			})
		}
	)
}
/*
sumologic.com
not clear, but talks about free and ~$4
7k followers
*/
async function logToSumoLogic(message) {
	return await fetch(process.env.ACCESS_SUMOLOGIC_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			message: message
		})
	})
}















































