



/*
ping1 cloudflare pages, nuxt page without script at all
ping2 cloudflare workers, server time with useState, server function

ping3 cloudflare workers, server time with useFetch, server true        /api/ping/ping3
ping4 worker to supabase, database query                                /api/ping/ping4
ping5 worker to amazon, lambda time                                     /api/ping/ping5


example output deployed below, using curl to save html pages without running script on them
running locally there's more variety as wrangler, nitro and serverless framework emulate things
these are ready to go, now you just hand them to pingdom

ping1:
  template says:
    ping1done

ping2:
  script setup says:
    page 9/7/2024, 11:47:50 PM Coordinated Universal Time, 1725752870604, {z:0}, v2024sep7k, ping2done

ping3:
  fetch to worker took 0ms to say:
    worker 9/7/2024, 11:47:54 PM Coordinated Universal Time, 1725752874218, {z:0,a:Cloudflare-Workers}, v2024sep7k, ping3done

ping4:
  fetch to worker to database took 358ms to say:
    worker 9/7/2024, 11:47:58 PM Coordinated Universal Time, 1725752878179, {z:0,a:Cloudflare-Workers}, v2024sep7k, database took 358ms to get count 553, ping4done

ping5:
  fetch to worker to lambda took 217ms to say:
    lambda took 217ms to say:
      lambda 9/7/2024, 11:48:02 PM Coordinated Universal Time, 1725752882270, {z:0,v:11.3.244.8-node.23,n:20.16.0}, v2024sep7k, ping5done

*/


//here's the ping library, which loads without loading everything else
//just to share around the ping pages and apis


export function pingVersion() { return 'v2024sep7k' }
export function pingTime() {
	let d = new Date()
	return `${d.toLocaleString('en-US', {timeZoneName: 'long'})}, ${d.getTime()}`
}
export function pingEnvironment() {//get a small object of clues as to where we are running

	let z = (new Date()).getTimezoneOffset()+''//works everywhere, clue as to time zone computer is running in
	let v = typeof process != 'undefined' && process?.versions?.v8//works in local node and lambda
	let n = typeof process != 'undefined' && process?.versions?.node//also only node and lambda
	let a = typeof navigator != 'undefined' && navigator?.userAgent//works on desktop and mobile browsers

	let s = 'ping environment'
	if (z) s += ' z:'+z
	if (v) s += ' v:'+v
	if (n) s += ' n:'+n
	if (a) s += ' a:'+a
	return s

/*
	console.log(`z: ${z}, v: ${v}, n: ${n}, a: ${a}`)

	let o = {}
	if (z) o.z = z
	if (v) o.v = v
	if (n) o.n = n
	if (a) o.a = a
	return JSON.stringify(o)
*/
}













