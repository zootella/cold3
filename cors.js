
import {
log, look, defined, makeText,
Key, decryptKeys, headerGet,
sealEnvelope, Limit,
} from 'icarus'

const prepare = (cloudApex) => [
`
These tests verify that our lambdas are secured properly, and include a discussion about web stack security and CORS. Ok, let's get started! To begin, the /upload endpoint is configured for browser-to-Lambda communication. Pages at our domain should be able to call it directly; servers should be blocked. In our application code, checkOriginValid in level2.js requires a valid Origin header from the whitelist. Tests 1-5 verify this works correctly.

Test 1 📋 Preflight from whitelisted origin

When JavaScript on a page makes a cross-origin request (different scheme, host, or port) that the browser considers "complex" (a POST with JSON, or custom headers, or methods like PUT/DELETE), the browser first sends an OPTIONS request called a "preflight" to ask the server if the desired request that will follow will be allowed. The browser does this automatically at the start of performing page script's fetch() or XMLHttpRequest call - the developer doesn't write this code. Simple requests (GET, or POST with text/plain) skip preflight entirely. Navigation (clicking links, typing URLs) doesn't trigger preflight because there the user is navigating the whole browser to a page (with its own origin in the location bar), not having script on a page at one origin make a request to another one.

Our /upload endpoint is configured to accept requests from pages only. The doorLambda function in level2.js handles OPTIONS requests by checking if the Origin matches our whitelist. If so, it returns 204 with Access-Control-Allow-Origin matching the request. The browser sees the match and proceeds to send the actual POST.
`,
{
	route: '/upload',
	method: 'OPTIONS',
	headers: {
		'Origin': cloudApex,
		'Access-Control-Request-Method': 'POST',
		'Access-Control-Request-Headers': 'Content-Type',
	},
	expect: {
		status: 204,
		headers: {
			'access-control-allow-origin': cloudApex,
		},
	},
},
`
Test 2 📋 Preflight from non-whitelisted origin

Now imagine malicious code at a script kiddie's website attempts the same request. The browser (unmodified - this is a script kiddie, not a fully grown hacker) sends the same OPTIONS preflight as in Test 1. The browser includes its actual origin in the Origin header (script cannot spoof this) and waits to see if the server's response grants permission.

Our doorLambda checks the Origin against our whitelist and finds no match. It returns 403 with no CORS headers. The browser sees the rejection and refuses to send the actual POST. The request never reaches our business logic - the browser stopped it. This is CORS enforcement: the browser is the enforcer, not the server.
`,
{
	route: '/upload',
	method: 'OPTIONS',
	headers: {
		'Origin': 'https://unrecognized.ninja',
		'Access-Control-Request-Method': 'POST',
		'Access-Control-Request-Headers': 'Content-Type',
	},
	expect: {
		status: 403,
	},
},
`
Test 3 📋 POST with no Origin (server-style request)

When a server (or curl, or any non-browser client) makes a request, there's no Origin header - browsers add that automatically for cross-origin requests, but other clients don't. There's also no preflight, because preflight is a browser behavior. The request goes straight to the endpoint.

Our Lambda receives this request and runs. Icarus' checkOriginValid function in level2.js checks for a valid Origin header. Finding none, it throws an error and the request fails with 500. This is our code doing its job. Without checkOriginValid, this request would have succeeded, allowing any server on the internet to call our upload endpoint.
`,
{
	route: '/upload',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: {
		action: 'Gate.',
	},
	expect: {
		status: 500,
	},
},
`
Test 4 📋 POST with non-whitelisted Origin

This test covers a scenario that browsers would normally prevent: sending a POST with an Origin header that didn't pass preflight. A real browser at unrecognized.ninja would be stopped at Test 2 (preflight mismatch). But a "simple request" with text/plain content-type skips preflight, and curl or modified browsers can skip it entirely. So we need to verify the Lambda rejects these too.

Test 3 proved checkOriginValid requires an Origin header to be present. This test proves it also validates the value against the whitelist. The Origin header is present but not in our whitelist, so checkOriginValid throws and the request fails with 500. This confirms our application code provides real validation, not just a presence check.
`,
{
	route: '/upload',
	method: 'POST',
	headers: {
		'Origin': 'https://unrecognized.ninja',
		'Content-Type': 'application/json',
	},
	body: {
		action: 'Gate.',
	},
	expect: {
		status: 500,
	},
},
`
Test 5 📋 POST with whitelisted Origin

This test simulates what happens after a successful preflight: the browser sends the actual POST with its Origin header included. Here we use fetch with the allowed Origin to mimic that browser behavior. In a real scenario, a browser would only reach this point if it already passed preflight (Test 1), but this test lets us verify the Lambda directly.

Our Lambda receives the request and checkOriginValid in level2.js examines the Origin header. It's present and matches our whitelist, so the check passes. The request proceeds to business logic - in this case the Gate. action, which simply returns success with a sticker. This is the only path that should succeed for /upload: a request with a valid, whitelisted Origin header.
`,
{
	route: '/upload',
	method: 'POST',
	headers: {
		'Origin': cloudApex,
		'Content-Type': 'application/json',
	},
	body: {
		action: 'Gate.',
	},
	expect: {
		status: 200,
		headers: {
			'access-control-allow-origin': cloudApex,
		},
		bodyContains: '"success":true',
	},
},
`
Now we'll test a different lambda. The /message endpoint is the opposite: it's designed for worker-to-Lambda communication only. Our workers (running on Cloudflare) call this endpoint to send emails and SMS messages. Pages should never call it directly - that would bypass our rate limiting and abuse prevention. In our application code, checkOriginOmitted in level2.js requires that the Origin header is absent - any request with an Origin header (which browsers always add for cross-origin requests) gets rejected. Tests 6-9 verify this works correctly.

Test 6 📋 Preflight to server-only endpoint

When a browser wants to make a complex cross-origin request (like POST with JSON), it sends an OPTIONS preflight first - same as Tests 1 and 2. But unlike /upload, the /message endpoint is for servers only. The doorLambda function doesn't have a preflight handler for server endpoints - it only handles OPTIONS for page endpoints.

When the OPTIONS request arrives, doorLambda processes it as a regular request, which fails because server endpoints expect no Origin header and require other authentication. The browser sees the failure and stops. The actual POST request is never sent - the browser blocked it at preflight.
`,
{
	route: '/message',
	method: 'OPTIONS',
	headers: {
		'Origin': cloudApex,
		'Access-Control-Request-Method': 'POST',
	},
	expect: {
		status: 500,
	},
},
`
Test 7 📋 POST with no Origin (server-to-server)

When a server (like our Cloudflare worker, or curl) makes a request, it doesn't include an Origin header - that's a browser behavior for cross-origin requests. Servers just send the request directly. There's no preflight either, since preflight is also browser-only. This is exactly how we want legitimate worker-to-Lambda communication to work.

Our Lambda receives the request and checkOriginOmitted in level2.js examines the headers. It confirms the Origin header is absent, which means this isn't coming from a browser page. The check passes, business logic runs, and we return success. This is the only path that should succeed for /message: a request with no Origin header, indicating server-to-server communication.
`,
{
	route: '/message',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	body: {
		action: 'Gate.',
		envelope: true,//with envelope true set here, our test runner below will mint a valid Network23. envelope, just like trusted code in the worker does on each call to Lambda
	},
	expect: {
		status: 200,
		bodyContains: '"success":true',
	},
},
`
Test 8 📋 POST with Origin header (simulating page)

In a real browser scenario, this request would never happen - Test 6 showed that preflight fails for /message, so the browser would stop there. But what if someone uses curl or a modified browser to skip preflight and send a POST directly with an Origin header? This test verifies our code catches that case. Note we're using our own domain as the Origin - even trusted origins are blocked from this endpoint.

Our Lambda receives the request and checkOriginOmitted in level2.js sees an Origin header is present. Regardless of its value, the presence of any Origin header indicates this request came from (or is pretending to come from) a browser page. The check throws and the request fails with 500. This is our code protecting us - any Origin header means rejection.
`,
{
	route: '/message',
	method: 'POST',
	headers: {
		'Origin': cloudApex,
		'Content-Type': 'application/json',
	},
	body: {
		action: 'Gate.',
		envelope: true,
	},
	expect: {
		status: 500,
	},
},
`
Test 9 📋 Simple request with text/plain and Origin

This is the most important test for understanding why code-level checks are essential. A "simple request" - POST with text/plain content-type - skips preflight entirely. The browser sends it directly without asking permission first. This means Test 6's protection (preflight fails) doesn't help here. The request sails right past the preflight layer and reaches the Lambda. A malicious page could do exactly this.

Our Lambda receives the request and checkOriginOmitted in level2.js sees the Origin header. The check throws and the request fails with 500. This test proves that preflight alone cannot fully protect a server-only endpoint - simple requests bypass preflight, so our code must be the final line of defense. Without checkOriginOmitted, this request would have succeeded, allowing any page on the internet to call our /message endpoint.
`,
{
	route: '/message',
	method: 'POST',
	headers: {
		'Origin': 'https://unrecognized.ninja',
		'Content-Type': 'text/plain',
	},
	body: {
		action: 'Gate.',
		envelope: true,
	},
	expect: {
		status: 500,
	},
},
]

async function main() {
	process.loadEnvFile()
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: 'n10', environment: process.env})
	}
	await decryptKeys('node', sources)

	let cloudApex = `https://${Key('domain, public')}`
	let t = prepare(cloudApex)
	let d = t.filter(x => typeof x !== 'string')
	let single = parseInt(process.argv[2]) || null //yarn cors 2 runs just test 2
	let results = []//all test results
	if (single) {
		results.push(await runTest(d[single - 1]))
	} else {
		for (let test of t) {
			if (typeof test === 'string') log(test)
			else results.push(await runTest(test))
		}
	}
	let passed = results.filter(r => !r.length)//successful test results, which will be empty arrays
	let failed = results.filter(r => r.length)//unsuccessful test results, each would be an array of unsatisified expectations
	log(failed.length ? `Some tests failed! ⚠️⚠️⚠️` : `All ${results.length} tests passed ✅`)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })

async function runTest({route, method, headers, body, expect}) {
	let url
	if      (route == '/upload')  url = Key('upload lambda url, public')//our lambda function secured to work with pages, only
	else if (route == '/message') url = Key('message lambda url')//our lambda function secured to work with servers, only
	else toss('code')

	if (body) {//prepare reqest body
		if (body.envelope) body.envelope = await sealEnvelope('Network23.', Limit.handoffLambda, {})//fresh keycard just like Lambda mints
		body = makeText(body)//stringify
	}

	let a = []
	a.push('', `${method} ${route}`)
	a.push(look({headers, body}))

	let response = await fetch(url, {method, headers, body})//using fetch here in Node, but just as good as bash $ curl; both are non-browser clients that don't enforce CORS, can send arbitrary headers, including Origin or not, and don't automatically do preflight (fetch does when script in a page calls it, but not here in local command line Node) these tests are about how our deployed lambdas act, not browser behavior, and the lambda can't tell what we're running on this end
	let status = response.status
	let responseHeaders = Object.fromEntries([...response.headers.entries()])
	let responseBody = await response.text()

	let r = [`${status} ${response.statusText}`]
	for (let [k, v] of Object.entries(responseHeaders)) r.push(`${k}: ${v}`)
	r.push('', responseBody || '«empty body»')
	a.push('', r.join('\n'))

	let f = []//🐳
	if (status != expect.status) {
		f.push(`Expected status ${expect.status}, got ${status} ❌`)
	}
	if (expect.headers) {
		for (let [k, v] of Object.entries(expect.headers)) {
			let actual = headerGet(responseHeaders, k)
			if (actual !== v) f.push(`Expected header ${k}: ${v}, got: ${actual || '(missing)'} ❌`)
		}
	}
	if (expect.bodyContains && !responseBody.includes(expect.bodyContains)) {
		f.push(`Expected body to contain "${expect.bodyContains}" ❌`)
	}

	f.length ? a.push('', '🔴 Unexpected result:', look(f)) : a.push('', '🟢 Success')
	log(...a)
	return f
}
