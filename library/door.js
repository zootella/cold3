
//oh, there's a knock at our front door!
//cloudflare has invoked a worker and sent an event for us to respond to a request using nuxt
//or, amazon has invoked a lambda and sent an event and context for us to respond

/* nuxt server api cloudflare worker copypasta:
import { Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'

export default defineEventHandler(async (workerEvent) => {
	let door, response, error
	try {

		door = doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(workerEvent, door)

	} catch (e) { error = e }
	try {

		await doorWorkerShut(workerEvent, door, response, error)
		if (response && !error) return response.body

	} catch (d) { console.error(`discarded ${Now()} ${Tag()}`, d) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the door
*/

/* lambda copypasta:
exports.handler = async (lambdaEvent, lambdaContext) => {
	let door, response, error
	try {

		door = doorLambdaOpen(lambdaEvent)
		response = await doorProcessBelow(lambdaEvent, lambdaContext, door)

	} catch (e) { error = e }
	try {

		await doorLambdaShut(lambdaEvent, door, response, error)
		if (response && !error) return { statusCode: 200, headers: {'Content-Type': 'application/json'}, body: response.bodyStringified }

	} catch (d) { console.error(`discarded ${Now()} ${Tag()}`, d) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
//^our copypasta to safely man the front door
*/

export function doorWorkerOpen(workerEvent) {}
export function doorLambdaOpen(lambdaEvent) {}
export async function doorWorkerShut(workerEvent, door, response, error) {}
export async function doorLambdaShut(lambdaEvent, door, response, error) {}







/*


//worker, get information
function workerGotInformationEarlier() {
	let body
	try {
		startRequestStopwatch()
		saveCloudEvent(event)//(1) example of application function to store information about the request that invoked us

		//up top, let's get information about the request, event, and client talking to us
		let tlsVersion = event.req.cf?.tlsVersion//like "TLSv1.3" or undefined if http rather than https
		let clientIp = event.req.headers['cf-connecting-ip']//like "192.168.1.1" or "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
		//^ this information comes from cloudflare, so the client cannot fake it

		let origin = event.req.headers['origin']//nuxt makes this lowercase
		let referer = event.req.headers['referer']//and web standards can't correct this spelling!
		//^ these come from the client browser, so script alone cannot fake it, but curl or postman can

		//and now the rest are set by the client, and can be changed by script or browser extensions
		let userAgent = event.req.headers['user-agent']//like "Mozilla/5.0 (iPhone; CPU iPhone OS..."
		let method = getMethod(event)//like "GET" or "POST"
		let url = event.req.url//like "route/subroute?key=value"

		body = await readBody(event);//post only, but that's what we accept

		let r = myEventHandler(event, body)//(2) example of application function to process request
		r = {//which will return a simple js object with information to tell the client, like this:
			message: 'a message back to the client',
			tick: Date.now(),
			count: 42
		}

		stopRequestStopwatch()
		return r//200 OK by default
	} catch (e) {
		stopRequestStopwatch()
		logCloudError({e, event, body})//(3) application function to log an exception to datadog for review by the development team
		return createError({statusCode: 500})//minimal and generic error to potentially untrustworthy client
	}
}






//worker, get information
function workerGotInformation {

	//confirmed by cloudflare
	let tlsVersion = event.req.cf?.tlsVersion//like "TLSv1.3" or undefined if http rather than https
	let clientIp = event.req.headers['cf-connecting-ip']//like "192.168.1.1" or "2001:0db8:85a3:0000:0000:8a2e:0370:7334"

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = event.req.headers['origin']//nuxt makes this lowercase
	let referer = event.req.headers['referer']//and web standards can't correct this spelling!

	//script and extensions can spoof these, or they are simply set by the user and his script or extensions
	let url = event.req.url//like "route/subroute?key=value"
	let method = getMethod(event)//like "GET" or "POST"
	let userAgent = event.req.headers['user-agent']//like "Mozilla/5.0 (iPhone; CPU iPhone OS..."
}

//lambda, get information
function lambdaGotInformation {

	//confirmed by amazon
	let isHttps = event.headers['x-forwarded-proto'] == 'https'//set by api gateway
	let clientIp = event.requestContext?.identity?.sourceIp

	//can't be spoofed by script or extension, but can be set by a sophisticated attacker
	let origin = event.headers['origin']
	let referer = event.headers['referer']

	//script and extensions can spoof these, or they are simply set by the user and his script or extensions
	let method = event.httpMethod
	let urlPath = event.path
	let urlQueryStringParameters = event.queryStringParameters
	let userAgent = event.headers['User-Agent']

	context.awsRequestId//A unique identifier for the request (useful for tracing and debugging).
}







*/




















