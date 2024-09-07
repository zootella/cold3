



/*
ping1 cloudflare pages, nuxt page without script at all
ping2 cloudflare workers, server time with useState, server function

ping3 cloudflare workers, server time with useFetch, server true        /api/ping/ping3
ping4 worker to supabase, database query                                /api/ping/ping4
ping5 worker to amazon, lambda time                                     /api/ping/ping5
*/


//here's the ping library, which loads without loading everything else
//just to share around the ping pages and apis


export function pingVersion() { return 'v2024sep7g' }


export function pingTime() {
	let d = new Date()
	return `${d.toLocaleString('en-US', {timeZoneName: 'long'})}, ${d.getTime()}`
}
export function pingEnvironment() {//get a small object of clues as to where we are running

	let z = (new Date()).getTimezoneOffset()+''//works everywhere, clue as to time zone computer is running in
	let v = typeof process != 'undefined' && process?.versions?.v8//works in local node and lambda
	let n = typeof process != 'undefined' && process?.versions?.node//also only node and lambda
	let a = typeof navigator != 'undefined' && navigator?.userAgent//works on desktop and mobile browsers

	let o = {}
	if (z) o.z = z
	if (v) o.v = v
	if (n) o.n = n
	if (a) o.a = a
	return JSON.stringify(o)
}






















