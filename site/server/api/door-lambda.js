
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
dog,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let response = {}





	let lambdaResult = await bridge('/door', {name: door.body.name, age: door.body.age})
	let message = lambdaResult.message

	response.message = message
	response.when = Now()
	return response
}


//october maybe rename this bridge entirely. no, it goes away--trusted code in cloudflare will call lambda functions as needed; this is a bridge directly from untrusted client code through a worker to lambda, which is great for demonstration and testing, but is not a part of the evenutal design!





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
	let access = await getAccess()
	let host = (forceCloudLambda || Sticker().isCloud) ? resourceCloudNetwork23 : resourceLocalNetwork23
	body.ACCESS_NETWORK_23_SECRET = access.get('ACCESS_NETWORK_23_SECRET')//don't forget your keycard
	return await $fetch(host+path, {method: 'POST', body})
}




















