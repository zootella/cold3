
import {
log, look, defined,
Key, decryptKeys, headerGet,
} from 'icarus'
import dotenv from 'dotenv'

/*
CORS and Origin Security Tests for Lambda Function URLs

These tests verify that the doorLambda security layer correctly handles:
- Page endpoints (/upload): require valid Origin from whitelist
- Server endpoints (/message): require Origin to be absent

Run with: yarn cors

Based on the manual curl tests documented in gate.md, now automated.
*/

async function main() {
	dotenv.config({quiet: true})

	// Unlock secrets so Key() can get lambda URLs
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: 'cors', environment: process.env})
	}
	await decryptKeys('cors', sources)

	// Get lambda URLs and expected origin from keys
	let uploadUrl = Key('upload lambda url, public')
	let messageUrl = Key('message lambda url')
	let allowedOrigin = `https://${Key('domain, public')}`

	log('')
	log('╔════════════════════════════════════════════════════════════════════╗')
	log('║           CORS and Origin Security Tests                           ║')
	log('╚════════════════════════════════════════════════════════════════════╝')
	log('')
	log(`Upload Lambda:  ${uploadUrl}`)
	log(`Message Lambda: ${messageUrl}`)
	log(`Allowed Origin: ${allowedOrigin}`)
	log('')

	let allPassed = true

	// /upload - Page endpoint (requires valid Origin from whitelist)
	log('┌────────────────────────────────────────────────────────────────────┐')
	log('│  /upload - Page Endpoint (requires valid Origin from whitelist)   │')
	log('└────────────────────────────────────────────────────────────────────┘')

	if (!await runTest({
		name: 'Test 1: Preflight from whitelisted origin',
		url: uploadUrl,
		method: 'OPTIONS',
		headers: {
			'Origin': allowedOrigin,
			'Access-Control-Request-Method': 'POST',
			'Access-Control-Request-Headers': 'Content-Type',
		},
		expectStatus: 204,
		expectHeaders: {'access-control-allow-origin': allowedOrigin},
	})) allPassed = false

	if (!await runTest({
		name: 'Test 2: Preflight from non-whitelisted origin',
		url: uploadUrl,
		method: 'OPTIONS',
		headers: {
			'Origin': 'https://evil-site.com',
			'Access-Control-Request-Method': 'POST',
			'Access-Control-Request-Headers': 'Content-Type',
		},
		expectStatus: 403,
	})) allPassed = false

	if (!await runTest({
		name: 'Test 3: POST with no Origin (server-style request)',
		url: uploadUrl,
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 500,
	})) allPassed = false

	if (!await runTest({
		name: 'Test 4: POST with non-whitelisted Origin',
		url: uploadUrl,
		method: 'POST',
		headers: {
			'Origin': 'https://evil-site.com',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 500,
	})) allPassed = false

	if (!await runTest({
		name: 'Test 5: POST with whitelisted Origin',
		url: uploadUrl,
		method: 'POST',
		headers: {
			'Origin': allowedOrigin,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 200,
		expectHeaders: {'access-control-allow-origin': allowedOrigin},
		expectBodyContains: '"success":true',
	})) allPassed = false

	// /message - Server endpoint (requires Origin to be absent)
	log('┌────────────────────────────────────────────────────────────────────┐')
	log('│  /message - Server Endpoint (requires Origin to be absent)        │')
	log('└────────────────────────────────────────────────────────────────────┘')

	if (!await runTest({
		name: 'Test 6: Preflight to server-only endpoint',
		url: messageUrl,
		method: 'OPTIONS',
		headers: {
			'Origin': allowedOrigin,
			'Access-Control-Request-Method': 'POST',
		},
		expectStatus: 500,
	})) allPassed = false

	if (!await runTest({
		name: 'Test 7: POST with no Origin (server-to-server)',
		url: messageUrl,
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 200,
		expectBodyContains: '"success":true',
	})) allPassed = false

	if (!await runTest({
		name: 'Test 8: POST with Origin header (simulating page)',
		url: messageUrl,
		method: 'POST',
		headers: {
			'Origin': allowedOrigin,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 500,
	})) allPassed = false

	if (!await runTest({
		name: 'Test 9: Simple request with text/plain and Origin',
		url: messageUrl,
		method: 'POST',
		headers: {
			'Origin': 'https://evil-site.com',
			'Content-Type': 'text/plain',
		},
		body: JSON.stringify({action: 'Gate.'}),
		expectStatus: 500,
	})) allPassed = false

	if (!allPassed) process.exit(1)
}

async function runTest({name, url, method, headers, body, expectStatus, expectHeaders, expectBodyContains}) {
	let a = []
	a.push(name)
	a.push(`→ ${method} ${url}`)
	a.push(look({headers, body}))

	let response = await fetch(url, {method, headers, body})
	let status = response.status
	let responseHeaders = Object.fromEntries([...response.headers.entries()])
	let responseBody = await response.text()

	a.push(`← ${status}`)
	a.push(look({responseHeaders, responseBody}))

	let failures = []
	if (status !== expectStatus) {
		failures.push(`Expected status ${expectStatus}, got ${status}`)
	}
	if (expectHeaders) {
		for (let [k, v] of Object.entries(expectHeaders)) {
			let actual = headerGet(responseHeaders, k)
			if (actual !== v) failures.push(`Expected header ${k}: ${v}, got: ${actual || '(missing)'}`)
		}
	}
	if (expectBodyContains && !responseBody.includes(expectBodyContains)) {
		failures.push(`Expected body to contain "${expectBodyContains}"`)
	}

	let passed = failures.length === 0
	a.push(passed ? `🟢 Success` : `🔴 Unexpected result!`)
	if (!passed) a.push(look(failures))

	log(...a)
	return passed
}

main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
