
import { Sticker } from '../../library/sticker.js'
import { log, look, Now, checkText } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { doorWorkerOpen, doorWorkerShut } from '@/library/door.js'
import { awaitLogAlert } from '@/library/cloud.js'

export default defineEventHandler(async (workerEvent) => {
	let door = {}, response, error
	try {




		door = await doorWorkerOpen(workerEvent)
		response = await doorProcessBelow(door)

	} catch (e) { error = e }
	try {




		let r = await doorWorkerShut(door, response, error)
		if (response && !error) return r

	} catch (f) { await awaitLogAlert('door shut', {f, door, response, error}) }
	setResponseStatus(workerEvent, 500); return null
})
//^our copypasta to safely man the front door

async function doorProcessBelow(door) {
	let response = {}





	let lambdaResult = await bridge('/door', {name: door.body.name, age: door.body.age})
	let message = lambdaResult.message

	response.message = message
	response.when = Now()
	return response
}











//  _          _     _              _                     _   ____  _____ 
// | |__  _ __(_) __| | __ _  ___  | |_ ___    _ __   ___| |_|___ \|___ / 
// | '_ \| '__| |/ _` |/ _` |/ _ \ | __/ _ \  | '_ \ / _ \ __| __) | |_ \ 
// | |_) | |  | | (_| | (_| |  __/ | || (_) | | | | |  __/ |_ / __/ ___) |
// |_.__/|_|  |_|\__,_|\__, |\___|  \__\___/  |_| |_|\___|\__|_____|____/ 
//                     |___/                                              

/*
forceCloudLambda false means local worker -> local lambda; cloud worker -> cloud lambda
forceCloudLambda true  means local worker -> cloud lambda; cloud worker -> cloud lambda
either way a cloud worker always calls to a cloud lambda, because callign down wouldn't work at all
*/
const forceCloudLambda = false
const resourceLocalNetwork23 = 'http://localhost:4000/prod'//check your local Network 23 affliate
const resourceCloudNetwork23 = 'https://api.net23.cc'//or our global connectivity via satellite
async function bridge(path, body) {
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	let host = (forceCloudLambda || Sticker().isCloud) ? resourceCloudNetwork23 : resourceLocalNetwork23
	body.ACCESS_NETWORK_23_SECRET = process.env.ACCESS_NETWORK_23_SECRET//don't forget your keycard
	return await $fetch(host+path, {method: 'POST', body})
}




















/*

local lambda:

lambdaEvent.headers:
{
  host: "localhost:4000" ‹14›
  connection: "keep-alive" ‹10›
  accept: "application/json" ‹16›
  content-type: "application/json" ‹16›
  accept-language: "*"
  sec-fetch-mode: "cors"
  user-agent: "node"
  accept-encoding: "gzip, deflate" ‹13›
  content-length: "88"
}





cloud lambda:

lambdaEvent.headers:
{ ‹11›
  accept: "application/json" ‹16›
  accept-encoding: "br, gzip, deflate" ‹17›
  accept-language: "*"
  content-type: "application/json" ‹16›
  Host: "api.net23.cc" ‹12›
  sec-fetch-mode: "cors"
  User-Agent: "node"
  X-Amzn-Trace-Id: "Root=1-66edc318-1ba20cca01e008b9627d1394" ‹40›
  X-Forwarded-For: "149.106.98.24" ‹13›
  X-Forwarded-Port: "443"
  X-Forwarded-Proto: "https"
}

*/




/*

ping 5 worker to lambda:

export default defineEventHandler(async (event) => {
	let note = ''
	try {

		let t = Date.now()
		let lambdaNote = (await $fetch('https://api.net23.cc/ping5')).note
		let duration = Date.now() - t

		note = `worker says: lambda took ${duration}ms to say: ${lambdaNote}`

	} catch (e) { note = 'ping5 worker error: '+e.stack }
	return {note}
})

ping 5 lambda:



import { Sticker } from '../../library/sticker.js'


export const handler = async (event) => {
	let note = ''
	try {





		note = `lambda says: ${Sticker().all}, ping5done`

	} catch (e) { note = 'ping5 lambda error: '+e.stack }
	return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({note}) }
}


*/












