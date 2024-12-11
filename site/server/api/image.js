
import {
log, look, checkTag, Time,
doorWorker,
vhsSign,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker('POST', {workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let o = {}

	let s = await vhsSign('/', 2*Time.hour)//generate a query string that will allow access to everything at vhs.net23.cc for the next two hours
	o.source = 'https://vhs.net23.cc/banner.png'+'?'+s

	return o
}
