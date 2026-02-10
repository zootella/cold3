
import {
log, look, toss, saySize4, Now, Time, Key, otpGenerate,
} from 'icarus'

async function main() {
	let urlPage = `https://${Key('domain, public')}/card/test${otpGenerate(4)}`//page at deployed site with a custom card for a random route

	let a = [], bullet
	a.push('', `Fetching page to extract og:image URL...`, urlPage)
	let html = await (await fetch(urlPage)).text()
	let match = html.match(/og:image" content="([^"]+)"/)
	if (!match) toss('🔴 Could not find og:image URL in page HTML')
	let urlImage = match[1]
	a.push(urlImage)

	a.push('', 'First fetch to render fresh', '')
	let r1 = await runFetch(a, urlImage)
	bullet = '1️⃣ '
	check(a, bullet, r1.status === 200, `${r1.status} status — worker returned ok`)
	check(a, bullet, r1.headers['x-card-source'] === 'FRESH', `${r1.headers['x-card-source'] || '(missing)'} x-card-source — satori rendered a new card`)
	check(a, bullet, r1.headers['content-type'] === 'image/png', `${r1.headers['content-type'] || '(missing)'} content-type — response is a PNG image`)
	check(a, bullet, !r1.headers['set-cookie'], `${r1.headers['set-cookie'] ? 'present' : 'absent'} set-cookie — no cookie, so CDN will cache`)

	a.push('', '... sleeping 3 seconds 💤 ...')
	log(...a); a = []
	await new Promise(r => setTimeout(r, 3*Time.second))

	a.push('', 'Repeat fetch to get recycled', '')
	let r2 = await runFetch(a, urlImage)
	bullet = '2️⃣ '
	check(a, bullet, r2.status === 200, `${r2.status} status — worker returned ok`)
	check(a, bullet, r2.headers['x-card-source'] === 'RECYCLED', `${r2.headers['x-card-source'] || '(missing)'} x-card-source — served from edge cache, not re-rendered`)
	check(a, bullet, r2.headers['cf-cache-status'] === 'HIT', `${r2.headers['cf-cache-status'] || '(missing)'} cf-cache-status — cloudflare CDN confirms cache hit`)
	check(a, bullet, r2.headers['age'], `${r2.headers['age'] || '(missing)'} age — seconds since cloudflare cached this card`)
	check(a, bullet, r2.headers['content-type'] === 'image/png', `${r2.headers['content-type'] || '(missing)'} content-type — response is a PNG image`)
	check(a, bullet, !r2.headers['set-cookie'], `${r2.headers['set-cookie'] ? 'present' : 'absent'} set-cookie — no cookie, so CDN will cache`)

	a.push('')
	let pct = Math.round(100* r2.elapsed / r1.elapsed)
	check(a, '⏱️', r2.elapsed < r1.elapsed, `second delivery from CDN in ${Math.round(100 * r2.elapsed / r1.elapsed)}% of the render time`)
	log(...a, '')
	//⚠️ the second fetch expects a cache hit, but occasionally fails because Cloudflare's Cache API is per-datacenter and anycast routing can send consecutive requests to different PoPs (check cf-placement in the headers above — if they differ, that's why)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })

function check(a, bullet, pass, note) { a.push(pass ? `${bullet} ✅ ${note}` : `${bullet} 🔴 ${note}`) }

async function runFetch(a, url) {
	let start = Now()
	let response = await fetch(url)
	let elapsed = Now() - start

	let status = response.status
	let headers = Object.fromEntries([...response.headers.entries()])
	let body = await response.arrayBuffer()

	let u = new URL(url)
	a.push(`GET ${u.pathname}${u.search} HTTP/1.1`, `Host: ${u.host}`, '', `${status} ${response.statusText}`)
	for (let [k, v] of Object.entries(headers)) a.push(`${k}: ${v}`)
	a.push('', `${saySize4(body.byteLength)} received in ${elapsed} ms`)

	return {status, headers, elapsed, bodyLength: body.byteLength}
}
