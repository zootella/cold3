

import {
Sticker, isLocal, isCloud, log, look, urlNetwork23,
Now, Tag, getAccess, checkText,
doorWorker,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('GET', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let response = {}

	let lambdaResult = await $fetch(
		urlNetwork23() + '/dlg?' + (new URLSearchParams({
			name: door.body.name,
			quantity: door.body.quantity,
			condition: door.body.condition
		})).toString(),
		{
			method: 'GET'
		}
	)
	let message = lambdaResult.message

	response.message = message
	response.when = Now()
	return response
}

//ttd november, copied this to library2.js, refactor door-lambda once that's working, or get rid of it entirely
/*
ttd november - there won't be a cold3 api endpoint which just bridges over directly to network 23
trusted code in a worker will, in the middle of its business logic, use a bridge function to call a network 23 api
net23 lambdas are only called by trusted worker code, all calls are POST, all authenticated with the net23 secret
also, you think the lambda code won't need to use the database; rather the worker does from the net23 result
*/
/*
ttd january; below is from before urlNetwork23
const _forceCloudLambda = false
const resourceLocalNetwork23 = 'http://localhost:4000/prod'//check your local Network 23 affliate
const resourceCloudNetwork23 = 'https://api.net23.cc'//or our global connectivity via satellite
async function bridge(path) {
	checkText(path); if (path[0] != '/') toss('data', {path})//call this with path like '/door'
	let access = await getAccess()
	let host = (_forceCloudLambda || isCloud({uncertain: 'Cloud.'})) ? resourceCloudNetwork23 : resourceLocalNetwork23
	//body.ACCESS_NETWORK_23_SECRET = access.get('ACCESS_NETWORK_23_SECRET')//don't forget your keycard
	return await $fetch(host+path, {method: 'GET'})
}
*/
