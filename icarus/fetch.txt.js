




//   __      _       _     
//  / _| ___| |_ ___| |__  
// | |_ / _ \ __/ __| '_ \ 
// |  _|  __/ || (__| | | |
// |_|  \___|\__\___|_| |_|
//                         

/*
[i] a summary of our fetch functions

use fetchWorker in components and stores; it works on both the server and client in universal rendering
use fetchLambda in workers, only; only a worker can use the APIs of Network 23
use fetchProvider in workers and lambdas; only trusted code can contact third party providers

fetchWorker and fetchLambda use Nuxt's $fetch
fetchProvider uses ofetch, so we can use it from both Nuxt and Lambda

[ii] what calls what, adding which features

$fetch, from Nuxt:
- knows about Nuxt's universal rendering, short circuiting to a function call when a component or store is SSR
- adds the base URL for API routes
- integrates with Nuxt's runtime

and calls ofetch, formerly ohmyfetch, https://www.npmjs.com/package/ofetch 1.7 million weekly downloads, which:
- stringifies and parses the JSON body
- throws errors for non 2XX response codes
- allows request and response interceptors, which we're not using
- has retry and timeout features, which maybe Nuxt uses but we don't directly

which calls the browser's native fetch()

[iii] nearby alternatives that we're *not* using

Nuxt's useFetch and useAsyncData, which returns a toolbox of stuff, reactive data, and loading state
Nuxt's useRequestFetch and requestFetch, fetch worker forwards the browser tag cookie manually
multi million download npm libraries, like axios, node-fetch, and superagent
*/



/*
ttd april fetch
ok, so then were are you allowed to call $fetch() and fetch() directly? that's a big grep

where code to start out with is calling $fetch directly:
- validate turnstile token
- log to datadog
- call network 23
- lots of components
- PostButton, you've centralized and simplified there a lot, bring that into fetchWorker and call fetchWorker there
- door example pages like dbg and rpw
- up pages like ping5 and test
- stores like helloStore and hitStore

where code to start out with is calling fetch() directly:
- fetchProvider calls fetch() to work in worker and lambda []maybe import and call ofetch


*/









/*
usually POST, could be GET
usually 

we fetch to the turnstile api only from a worker, so it can use $fetch
that fetch ues POST, adds headers, and body is URLSearchParams

we fetch to the datadog api from worker and lambda, so it can't use $fetch
that fetch uses POST, headers, and body is text?!

just have method and headers optional, so you can keep one function call path, and throw in method: 'GET' and headers: {whatever} where you need to

right now turnstile is using $fetch, but you can change that to fetchProvider
and have fetchProvider use ofetch, which is interesting--you'll have to add it to the lambda, so be careful that doesn't mess up the build
*/

//icarus $ yarn add oftech, you should identify 1.4.1 which is both current and what is already in the project
import {ofetch} from 'ofetch'

//(1) post a json body, no additional headers
const response = await $fetch('/api/posts', {
	method: 'POST',
	body: {content: 'This is a test post.'}
})

//(2) get instead of post, add a header, query string instead of body
const response = await $fetch('/api/search', {
	method: 'GET',
	headers: {'Authorization': `Bearer YOUR_TOKEN`},
	query: {keyword: 'Nuxt', category: 'framework'}//$fetch will automatically url encode this correctly
})

//(3) post a plain text body
const response = await $fetch('/api/message', {
	method: 'POST',
	headers: {'Content-Type': 'text/plain'},//override the default JSON headers and ensure the raw string is sent
	body: 'Hello, this is a plain text message!'
})

//(4) post a url encoded body, the classic HTML form post from way back
const response = await $fetch('/api/form-submit', {
	method: 'POST',
	headers: {'Content-Type': 'application/x-www-form-urlencoded'},
	body: new URLSearchParams({name: 'First Last', email: 'first.last@example.com'})
})

//and for ofetch, they're the same--but the route has to be complete, starting "https://example.com/api/whatever", and features around SSR nd interceptors aren't present

/*
so let's say you want to do a feature like
add POST by default if theres no method yet
well, that's the only one
so just do that in both fetchWorker
ok, so then
the revenge of Ash Fetchum


fetchWorker - passes $fetch, adds browser tag cookie if we're already on the server (only)
fetchLambda - passes $fetch, adds net23 keycard
fetchProvider - passes ofetch
v all call:
ashFetchum (which is not exported)
*/
function ashFetchum(fetcher, url, options) {
	//fetcher is a function reference to $fetch or ofetch, one of those or the other, only
	//url can be absolute or relative, if we're using ofetch, it has to be absolute, but all of this will be on the same screen of code
	//and options are like {method, headers, body, query}
	/*
	additional features that ash adds here
	- set POST if not already set
	- put a Task around this to record what you used for the call, and how long it took
	- maybe, catch an exception, even if above you rethrow it in most instances (yeah, you like this, actually)
	and that's it, actually--have the caller using fetchWorker add headers like content type text plain or x form urlencoded
	*/
}









/* previously Ash Fetchum ...gotta fetch 'em all!

fetch() is from the browser, plain vanilla and what all the rest ultimately call down to
$fetch() is from nuxt, use in page and api code, server and client, but not lambda, obeys middleware and parses for you
useFetch() is from nuxt, use in page code, does universal rendering
fetchProvider() is our own, parses, measures duration, and catches errors

let r = fetchProvider(  takes...
	c,  [c]all parameters, everything you used to prepare the request
	q)  re[q]uest details, what ash will use to call fetch
r: {                 ...and returns c and q unchanged other than filling in q.tick, and:
	c,
	q,
	p   res[p]onse details, everything that happened as a result of the request
}

[c]all:
c might have details like c.name, c.email, c.phoneNumber which you prepared into q.body

re[q]uest:
q.resource is the url like https://example.com
q.method is GET or POST
q.headers is an object of keys and values for fetch
q.body is already stringified body text, raw and ready for fetch

time:
q.tick is when we made the request
p.tick is when we finished reading the response
p.duration is how long that took

res[p]onse:
p.success is true if everything looks good as far as ash can tell
p.response is what fetch returned
p.bodyText is raw from the wire
p.body is what we tried to parse that into
p.error is an exception if thrown
*/
export async function fetchProvider(c, q) {
	let o = {method: q.method, headers: q.headers, body: q.body}

	q.tick = Now()//record when this happened and how long it takes
	let response, bodyText, body, error, success
	try {
		response = await fetch(q.resource, o)
		bodyText = await response.text()
		if (response.ok) {
			success = true
			if (response.headers?.get('Content-Type')?.includes('application/json')) {
				body = makeObject(bodyText)//can throw, and then it's the api's fault, not your code here
			}
		}
	} catch (e) { error = e; success = false }//no success because error, error.name may be AbortError
	let t = Now()

	return {c, q, p: {success, response, bodyText, body, error, tick: t, duration: t - q.tick}}//returns p an object of details about the response, so everything we know about the re<q>uest and res<p>onse are in there ;)
}
/*
additional fancy features ash can't do yet, but you could add later:
(1) use axios, which keeps coming up in stackoverflow and chatgpt, and can do timeouts
fetch is working just fine, but can 52 million weekly npm downloads all be wrong? "¯\_(ツ)_/¯"
(2) set a give up timeout, using AbortController, setTimeout, and clearTimeout, or just axios
adding this and setting to like 4 seconds will keep a misbehaving API frm making the user wait
but also, workers only live 30 seconds max, and you've set lambda to the same, so that should also govern here
(3) have a fire and forget option, to not wait for the body to arrive, or not wait at all
you tried this and immediately logs were unreliable because cloudflare and amazon were tearing down early
the way to do this in a worker is event.waitUntil(p), which looks well designed
you don't think there's a way to do this in lambda, so instead you Promise.all() to delay sending the response
with that, workers are faster, lambdas the same, well maybe faster because now the fetches can run in parallel
but there's a code benefit: you could call dog() and logAudit() without having to await them
*/
//ttd april, not using this, remove; many of these ideas are in Task and fetch23 now, you think? but did not look closely













//call f(...request), returning a task with task.response f's return
async function callTaskThrow(name, f, ...request) {//if calling f throws, throw a task with details inside
	let task = await callTaskReturn(name, f, ...request)
	if (!task.success) tossTask(task)
}
async function callTaskReturn(name, f, ...request) {//return the task result of caling f, task.error if calling f threw
	let task = Task({name, request})
	try {
		task.response = await f(...request)
		task.success = true//ttd april, you have no confidence in this
	} catch (e) { task.error = e }
	task.finish()
	return task
}
/*
ttd april
large problems with this design
1 you'd like to come in to callTask with an existing task, which already has some properties, beyond just the parameters we're going to call f with
2 after the response, we need to do some custom steps to determine if

take a big step back and look at what just using Task and fetchProvider might look like, without callTaskThrow and callTaskReturn
already, with this design, you can't get callTaskThrow into persephone
*/


























