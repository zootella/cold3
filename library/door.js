
import { readBody } from 'h3'

import { log, look, Now, checkText, hasTextSame, toss, test, ok } from './library0.js'//lambdas call in here, too, so we can't use nuxt's @ shorthand
import { Tag } from './library1.js'
import { logAlert } from './cloud.js'

//      _                  
//   __| | ___   ___  _ __ 
//  / _` |/ _ \ / _ \| '__|
// | (_| | (_) | (_) | |   
//  \__,_|\___/ \___/|_|   
//                        

/*
oh, there's a knock at our front door!
cloudflare has invoked a worker and sent an event for us to respond to a request using nuxt
or, amazon has invoked a lambda and sent an event and context for us to respond

to make your own, copy the pasta at:
./net23/src/door.js   ~ for a new lambda endpoint
./server/api/door.js  ~ for a new worker endpoint

then write your code in doorProcessBelow() beneath
the copypasta calls common helper functions, implemented once here
*/

export async function doorWorkerOpen(workerEvent) {
	let door = {}//make door object to bundle everything together about this request we're doing
	door.startTick = Now()//record when we got the request
	door.tag = Tag()//tag the request for our own records
	door.workerEvent = workerEvent//save everything they gave us about the request

	let body = await readBody(workerEvent)//with cloudflare, worker, and nuxt, we get here while the body may still be arriving, and we have to import readBody from h3 to parse it
	door.body = body

	return door
}
export function doorLambdaOpen(lambdaEvent, lambdaContext) {
	let door = {}//our object that bundles together everything about this incoming request
	door.startTick = Now()//when we got it
	door.tag = Tag()//our tag for it
	door.lambdaEvent = lambdaEvent//save everything amazon is telling us about it
	door.lambdaContext = lambdaContext

	let bodyText = lambdaEvent.body//with amazon, we get here after the body has arrived, and we have to parse it
	let body = JSON.parse(bodyText)
	door.bodyText = bodyText
	door.body = body

	//confirm (1) the connection is secure
	if (lambdaEvent.headers['X-Forwarded-Proto'] && lambdaEvent.headers['X-Forwarded-Proto'] != 'https') toss('connection not secure', {door})//amazon api gateway only allows https, so this check is redundant. serverless framework's emulation does not include this header at all, so this check doesn't interrupt local development
	//(2) the request is not from any browser, anywhere; there is no origin header at all
	if (((Object.keys(lambdaEvent.headers)).join(';')+';').toLowerCase().includes('origin;')) toss('found origin header', {door})//api gateway already blocks OPTIONS requests and requests that mention Origin as part of the defaults when we haven't configured CORS, so this check is also redundant. The Network 23 Application Programming Interface is exclusively for server to server communication, no browsers allowed
	//(3) the network 23 access code is valid
	if (!hasTextSame(process.env.ACCESS_NETWORK_23, body.ACCESS_NETWORK_23)) toss('bad access code', {door})

	return door
}

export async function doorWorkerShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	if (error) {//processing this request caused an error
		logAlert('door worker shut error', {door})//tell staff about it
		return null//return no response
	} else {
		return response//nuxt will stringify and add status code and headers
	}
}
export async function doorLambdaShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	if (error) {
		logAlert('door lambda shut error', {door})
		return null
	} else {
		return {statusCode: 200, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(response)}//by comparison, amazon wants it raw
	}
}




const useLocalLambda = false
export async function fetchLambda(path, body) {
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	let host = useLocalLambda ? 'http://localhost:4000/prod' : 'https://api.net23.cc'
	body.ACCESS_NETWORK_23 = process.env.ACCESS_NETWORK_23//don't forget your keycard
	return await $fetch(host+path, {method: 'POST', body})
}












/*
add to door
send in request name text and and age number
send in response message text and tick number


*/



/*
TODO
[]get this pattern working at standard.js
[]go through and use this pattern for all your apis except the really old weird ones, and the really simple ping ones
*/



/*


//worker, get information
function workerGotInformationEarlier() {
	let body
	try {
		startRequestStopwatch()
		//saveCloudEvent(event)//(1) example of application function to store information about the request that invoked us

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




















