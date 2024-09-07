<script setup>


function getExecutionFingerprint() {

	let z = (new Date()).getTimezoneOffset()+''//works everywhere, clue as to time zone computer is running in
	let v = typeof process != 'undefined' && process?.versions?.v8//works in local node and lambda
	let n = typeof process != 'undefined' && process?.versions?.node//also only node and lambda
	let a = typeof navigator != 'undefined' && navigator?.userAgent//works on desktop and mobile browsers

	//nothing really to detect or fingerpint cloudflare workers from here, but the request has .cf wiht all kinds of stuff

	let o = {}
	if (z) o.z = z
	if (v) o.v = v
	if (n) o.n = n
	if (a) o.a = a
	let s = JSON.stringify(o)
	return s
}


/*
ping1 cloudflare pages, static page
ping2 cloudflare workers, server time
ping3 worker to supabase, database query
ping4 worker to amazon, lambda time
*/

let message = useState('ping2key', () => {//nuxt will only run this on the server
	//code here should *only* run on the server, *never* on the client
	//is there an additional way to make sure this is the case?

	let s
	if (process.server) {//not necessary, but adding as an additional check
		let d = new Date()
		s = `${d.toLocaleString('en-US', {timeZoneName: 'long'})}, ${d.getTime()}, ${getExecutionFingerprint()}, ping2done`
	} else {
		s = 'ping2error'
	}
	return s
})

</script>
<template>

<div>
<p>ping2: {{ message }}</p>
</div>

</template>
