
import { readBody } from 'h3'

import { Sticker } from './sticker.js'
import { Time, log, look, Now, checkText, hasTextSame, toss, test, ok, noop } from './library0.js'//lambdas call in here, too, so we can't use nuxt's @ shorthand
import { Tag } from './library1.js'
import { awaitDog, logAlert, awaitLogAlert } from './cloud.js'

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

//      _                        _                 _   _                 
//   __| | ___   ___  _ __    __| |_   _ _ __ __ _| |_(_) ___  _ __  ___ 
//  / _` |/ _ \ / _ \| '__|  / _` | | | | '__/ _` | __| |/ _ \| '_ \/ __|
// | (_| | (_) | (_) | |    | (_| | |_| | | | (_| | |_| | (_) | | | \__ \
//  \__,_|\___/ \___/|_|     \__,_|\__,_|_|  \__,_|\__|_|\___/|_| |_|___/
//                                                                      

export const durationEnvironment = 30*Time.second//cloudflare workers only run 30 seconds, and we've configured lambdas to be the same
export const durationFetch = 20*Time.second//have axios give up on a fetch after 20 seconds
export const durationWait = 4*Time.second//only wait 4 seconds for parallel promises to finish before returning the web response, which can cause cloudflare and amazon to tear down the execution environment

//      _                                              _               
//   __| | ___   ___  _ __   _ __  _ __ ___  _ __ ___ (_)___  ___  ___ 
//  / _` |/ _ \ / _ \| '__| | '_ \| '__/ _ \| '_ ` _ \| / __|/ _ \/ __|
// | (_| | (_) | (_) | |    | |_) | | | (_) | | | | | | \__ \  __/\__ \
//  \__,_|\___/ \___/|_|    | .__/|_|  \___/|_| |_| |_|_|___/\___||___/
//                          |_|                                        
/*
_doorPromises, below, is a module scoped variable
cloudflare guarantees a fresh execution environment for every request, but lambda does not
if a lambda gets busy, multiple requests may come into the same running environment,
and this array will fill up with promises from different requests
but, this is ok, because individual promises will still finish if they can,
and the 4s timeout means no request will get stuck for longer than that

_doorPromises contains promises, like fetching to datadog to store a log, that run in parallel while we handle the request
we won't need the results, but do need to wait for them all to finish before returning the web result
also, if one fails, we want to know about that
*/
let _doorPromises = []
export function doorPromise(p) {//instead of awaiting p, add it here to keep going in parallel, and wait for it at the end
	_doorPromises.push(p
		.then(result => ({success: true, result}))
		.catch(error => ({success: false, error})))//wrap the promise so we can get its result or error, and to prevent it from throwing
}
async function awaitDoorPromises(door) {//takes door just to log it
	let results = []
	if (_doorPromises.length) {//we've got some promises to wait for
		let note1 = _doorPromises.length

		//all the added door promises have been running in parallel, combine them now to wait for them all to finish
		let all = Promise.all(_doorPromises); _doorPromises = []//move the promises from the array to all

		//make a time limit promise to make sure we don't wait too long
		let limit = new Promise((resolve) => {
			setTimeout(() => { resolve([{success: false, timeout: true, error: 'gave up waiting'}]) }, durationWait)
		})

		//race the slowest door promise against the time limit
		let start = Now()
		results = await Promise.race([all, limit])
		let note2 = Now() - start
		await awaitDog(`raced ${note1} door promises for ${note2}ms`)
		/*
		note that this can't throw
		we've wrapped each door promise above with a .catch()
		and the time limit promise calls resolve() with success false, not reject()
		*/

		//if a door promise failed, or we hit the timeout, log it as an alert
		if (results.some(result => !result.success)) await awaitLogAlert('door promises rejected or timed out', {door, results})
		//but, don't toss; we still return a successful web response back up to the client
	}
	return results
}
noop(async () => {//a demonstration of waiting for door promises, success and fail, fast and slow

	//change between 1 and 10 seconds, and with and without failing door promises, to see different behaviors working
	const durationSlow = 1*Time.second
	const addFailures = true//for instance, 10 seconds and false failures shows the time limit working

	const durationFast = 200
	function bad(s) { return s.push('!') }//pass in a string to have it throw a type error

	//make a full variety of promises
	let p1 = Promise.resolve('already succeeded')
	let p2 = Promise.reject('already failed')
	let p3 = new Promise((resolve, reject) => { resolve('immediate success') })
	let p4 = new Promise((resolve, reject) => { bad('immediate failure'); resolve('resolution4') })
	let p5 = new Promise((resolve, reject) => { setTimeout(() => { resolve('quick success') }, durationFast) })
	let p6 = new Promise((resolve, reject) => { setTimeout(() => {
		//bad('quick failure'); resolve('resolution6')
		reject(new Error('quick failure'))
		/*
		you want to call bad to have it throw
		this works fine in p4 above
		but here, something about set timeout, javascript, or your stack catches it too early
		super weird but moving on
		*/
	}, durationFast)})
	let p7 = new Promise((resolve, reject) => { setTimeout(() => { resolve('slow success')       }, durationSlow) })

	//they're all already started and running in parallel; add them to the door promises array
	doorPromise(p1)//successes
	if (addFailures) doorPromise(p2)
	doorPromise(p3)
	if (addFailures) doorPromise(p4)
	doorPromise(p5)
	if (addFailures) doorPromise(p6)
	doorPromise(p7)

	//returning the web response can cause amazon and cloudflare to tear down the execution environment immediately!
	//so, before we return from the request handler, we await all the promises we added
	//but in case there's a really slow one, we also give up after 4 seconds
	log('start time')
	let results = await awaitDoorPromises()//returns when all are done, or the timeout happened first
	log(look(results))
})
noop(() => {//first, a demonstration of a promise race
	let p1 = new Promise((resolve, reject) => { setTimeout(() => { resolve('quick success')  }, 1*Time.second) })
	let p2 = new Promise((resolve, reject) => { setTimeout(() => { reject('gave up waiting') }, 2*Time.second) })
	let p3 = new Promise((resolve, reject) => { setTimeout(() => { resolve('slow success')   }, 3*Time.second) })

	log("and, they're off!")//logs below won't show up in icarus; look at console in the browser
	Promise.race([p1, p2]).then((result) => {
		log('1 versus 2 race result:', look(result))//hits here, quick success, after 1 (not 2) seconds
	}).catch((error) => {
		log('1 versus 2 race error:', look(error))
	})
	Promise.race([p3, p2]).then((result) => {
		log('3 versus 2 race result:', look(result))
	}).catch((error) => {
		log('3 versus 2 race error:', look(error))//hits here, gave up waiting, after 2 (not 3) seconds
	})
})

//      _                                                             _       _           _   
//   __| | ___   ___  _ __    ___  _ __   ___ _ __     __ _ _ __   __| |  ___| |__  _   _| |_ 
//  / _` |/ _ \ / _ \| '__|  / _ \| '_ \ / _ \ '_ \   / _` | '_ \ / _` | / __| '_ \| | | | __|
// | (_| | (_) | (_) | |    | (_) | |_) |  __/ | | | | (_| | | | | (_| | \__ \ | | | |_| | |_ 
//  \__,_|\___/ \___/|_|     \___/| .__/ \___|_| |_|  \__,_|_| |_|\__,_| |___/_| |_|\__,_|\__|
//                                |_|                                                         

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
	if (!hasTextSame(process.env.ACCESS_NETWORK_23_SECRET, body.ACCESS_NETWORK_23_SECRET)) toss('bad access code', {door})

	return door
}

export async function doorWorkerShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	let r
	if (error) {//processing this request caused an error
		logAlert('door worker shut', {error, door})//tell staff about it
		r = null//return no response
	} else {
		r = response//nuxt will stringify and add status code and headers
	}
	await awaitDoorPromises()
	return r
}
export async function doorLambdaShut(door, response, error) {
	door.stopTick = Now()//time
	door.duration = door.stopTick - door.startTick
	door.response = response//bundle
	door.error = error

	let r
	if (error) {
		logAlert('door lambda shut', {error, door})
		r = null
	} else {
		r = {statusCode: 200, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(response)}//by comparison, amazon wants it raw
	}
	await awaitDoorPromises()
	return r
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




















