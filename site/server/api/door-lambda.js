
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

/*
ttd november - there won't be a cold3 api endpoint which just bridges over directly to network 23
trusted code in a worker will, in the middle of its business logic, use a bridge function to call a network 23 api
net23 lambdas are only called by trusted worker code, all calls are POST, all authenticated with the net23 secret
also, you think the lambda code won't need to use the database; rather the worker does from the net23 result

since adding sharp to lambdas, you've seen reliability problems!
like a 500 internal server error that is corrected by hitting refresh in the browser
and, the cold start is apparent now--a first hit in the morning takes seconds, then after that it's fast
so make this bridge first hit a wakup endpoint, and then do the real request
this simple stateless workaround won't slow things down much and is way easier than trying to clean up a failed request will preventing duplicate stateful real world action, like sending the user two text messages instead of one




*/


















