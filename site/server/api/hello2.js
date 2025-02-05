
import {
Sticker, log, look, Now, Tag, getAccess, checkText, textToInt, doorWorker,
settingReadInt, settingWrite, headerGetOne,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	/*
	/api/hello2

	taking more time, give a new tab more information from is browserTag and graphics hardware
	like the user name
	stage of teh user, like anonymous, current, suspended, closed
	permission level of the user, like signed in normally, signed in for an hour of advanced permissions
	creator or not

	also log a hit, the quarter day unique rows in hit_table
	browser tag, from body
	graphics hardware, from body
	user agent string, from headers, so these are less trustworthy
	geography, from cloudflare
	ip address, from cloudflare
	tick now, from cloudflare, so these are more trustworthy

	hello2 can take more time because the page is running now with loading components while we get this info in parallel
	*/


	let h = workerEvent?.req?.headers
	let v
	
	v = headerGetOne(h, 'cf-connecting-ip')
	v = headerGetOne(h, 'user-agent')
	v = headerGetOne(h, 'cf-ipcountry')
	//above headers should always be there; below ones are sometimes there
	v = headerGetOne(h, 'cf-ipcity')
	v = headerGetOne(h, 'cf-region-code')
	v = headerGetOne(h, 'cf-postal-code')
	//you'll use these for (1) sudo access and (2) hit log


	return o
}


















