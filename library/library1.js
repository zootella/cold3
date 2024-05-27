
//library1 can import modules saved in the nuxt project's package.json above
import { noop, Time, test, ok, now, say, inspect, log, checkText, checkAlpha, randomBetween, sayWhenFeed, sayWhenPage } from './library0.js'
import { customAlphabet } from 'nanoid'






const tagLength = 21

//generate a new universally unique double-clickable tag of 21 letters and numbers
export function tag() {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
	return customAlphabet(alphabet, tagLength)()//same default nanoid length
}

//make sure a tag is exactly 21 letters and numbers, for the database
export function checkTag(s) {
	checkText(s); checkAlpha(s)
	if (s.length != tagLength) toss('data', {s})
}
test(() => {
	checkTag('qqdTuhRdZwJwo7KKeaegs')
})


//generate a short code of 6 numbers to confirm the user's email or sms
export function uniqueCode4() {
	return uniqueCode6();
	//TODO, just take the first four of a six
}
export function uniqueCode6() {
	while (true) {
		let s = customAlphabet('0123456789', 6)()
		if (s[0] == '0' || _hasTriple(s)) {//can't start with zero, or contain three in a row, as these are a little harder for users to deal with
		} else {
			return s;
		}
	}
}
function _hasTriple(s) {
	for (let i = 0; i < s.length - 2; i++) {
		if (s[i] == s[i + 1] && s[i] == s[i + 2]) {
			return true
		}
	}
	return false
}
test(() => {
	ok(!_hasTriple('abbc'))
	ok(_hasTriple('abbbc'))
	ok(_hasTriple('bbbc'))
	ok(_hasTriple('abbb'))
})




//generate some dummy posts
noop(() => {

	let quantity = 50
	let durationShort = 5*Time.minute
	let durationLong = 5*Time.day

	let n = now()
	let when = n
	let earlier
	let s = ''
	for (let i = quantity; i >= 1; i--) {
		earlier = randomBetween(durationShort, durationLong)
		when -= earlier
		s += `\r\n{tag: '${tag()}', post: ${i}, quantity: ${quantity}, tick: ${when} },`
	}
	log(s)
})


//dummy posts, later this will come from the database and be in pinia
let chronology = [
{tag: 'Fouv7hYGoytFMpU8JF0Fp', post: 50, quantity: 50, tick: 1716455539307 },
{tag: '9ybmRRMv7DkyyblkNvg7T', post: 49, quantity: 50, tick: 1716321894639 },
{tag: 'YnzMXqUGaU4yh1n8LdHag', post: 48, quantity: 50, tick: 1716137928364 },
{tag: 'HT11n28Iv82hlhuuSzCb0', post: 47, quantity: 50, tick: 1715978704727 },
{tag: 'hs5Ay6ZABoMOGFzBi1oyh', post: 46, quantity: 50, tick: 1715648092892 },
{tag: 'Rk9AeVaKsilRvwOO3YUfB', post: 45, quantity: 50, tick: 1715385111004 },
{tag: 'mTOttOiS3rR69OGjG1tvR', post: 44, quantity: 50, tick: 1715044766727 },
{tag: 'x32NK6ZDoRsmQbfSLZlGa', post: 43, quantity: 50, tick: 1714931303495 },
{tag: 'IE2VL7Co0Jt7q8dYXOXAt', post: 42, quantity: 50, tick: 1714727333266 },
{tag: 'O86XsWlaz4ta6cx16Q7IM', post: 41, quantity: 50, tick: 1714363110198 },
{tag: 'W78qwx7RwEgS26oEpUO2T', post: 40, quantity: 50, tick: 1714110838500 },
{tag: 'LWWpEotd0bsjnG7ARxkBA', post: 39, quantity: 50, tick: 1713728874624 },
{tag: 'rgLlcizQTbTrZwGwO52zf', post: 38, quantity: 50, tick: 1713419320801 },
{tag: 'ATALdIvNGgt57cTJdB1c3', post: 37, quantity: 50, tick: 1713378099230 },
{tag: 'IA6ZVmwZe4nxpRsqYdGC7', post: 36, quantity: 50, tick: 1713083064140 },
{tag: 'gzlKuZRrkq1QpVLQCWR1r', post: 35, quantity: 50, tick: 1712766656712 },
{tag: 'z7BWH5VzkdNEULWgX31CF', post: 34, quantity: 50, tick: 1712483923373 },
{tag: 'wH6vP23TMG3rSlogxIGKq', post: 33, quantity: 50, tick: 1712201991357 },
{tag: 'sKvZMRbUq10xnKjWMCuyH', post: 32, quantity: 50, tick: 1711795470621 },
{tag: 'xWeTKhoDh3vhI59eFTifV', post: 31, quantity: 50, tick: 1711740761762 },
{tag: 'RqzYoas2kdMLiy72e4ylN', post: 30, quantity: 50, tick: 1711399164136 },
{tag: 'qWW3MiOR6YV030VVsGs5l', post: 29, quantity: 50, tick: 1711157229938 },
{tag: 'G0QonkoCrx4tFom7kSjJQ', post: 28, quantity: 50, tick: 1711017080027 },
{tag: 'h9TKbMVxibNS94K0IKWu8', post: 27, quantity: 50, tick: 1710589463969 },
{tag: 'Xs57uky9VVJCnlEKEKea3', post: 26, quantity: 50, tick: 1710406061724 },
{tag: '6xUq3iwNvq24v6D3p7sdA', post: 25, quantity: 50, tick: 1709982957175 },
{tag: 'o4OJyHuH0G8qMfU8jSjkd', post: 24, quantity: 50, tick: 1709922737734 },
{tag: 'hM9jPxQSEEQBPxpHgiy18', post: 23, quantity: 50, tick: 1709672309425 },
{tag: 'AHkhsJ6EI8EM74M6zOy4A', post: 22, quantity: 50, tick: 1709241302124 },
{tag: 'F0VnEssG3rBUnF9HgkGC5', post: 21, quantity: 50, tick: 1708866753652 },
{tag: 'm036IiUkKGb899qGm8Np5', post: 20, quantity: 50, tick: 1708865723854 },
{tag: 'a3iY4QrGgqLASGWxWKpre', post: 19, quantity: 50, tick: 1708632254442 },
{tag: 'iCK0dTjFmXLeBTU2nyTx2', post: 18, quantity: 50, tick: 1708238475629 },
{tag: '4Tq6gURegueqbaug0vX0h', post: 17, quantity: 50, tick: 1708233767474 },
{tag: '56w1qDkNFyh1tykDfSW1z', post: 16, quantity: 50, tick: 1708206341461 },
{tag: 'aYfrIBit0gEevxyfSelzt', post: 15, quantity: 50, tick: 1707922248322 },
{tag: 'KAPNlvFDNpmOgCv0ksXlf', post: 14, quantity: 50, tick: 1707600171924 },
{tag: 'qoiOzOtBL1FxXXK4YSMWk', post: 13, quantity: 50, tick: 1707565602894 },
{tag: 'mDXOc16VmJ7MZmzlhArMm', post: 12, quantity: 50, tick: 1707355962825 },
{tag: 'EoF4DYlrR91pLwSn7vmbp', post: 11, quantity: 50, tick: 1707119235799 },
{tag: 'Q1OYdbUFVEHDE6coAjaqX', post: 10, quantity: 50, tick: 1707061636419 },
{tag: 'xmnlLx7N9n2YUzc58hWXY', post: 9, quantity: 50, tick: 1706702919517 },
{tag: 'RvXFcD5hiJijULzNwDDIO', post: 8, quantity: 50, tick: 1706662889740 },
{tag: 'nHsGz0kci0pdHdcYap3hr', post: 7, quantity: 50, tick: 1706287711293 },
{tag: 'oJarvWJkgYVD6btLeBndw', post: 6, quantity: 50, tick: 1706010726346 },
{tag: 'Ro36gVRki4uMClr6yXDW0', post: 5, quantity: 50, tick: 1705972706981 },
{tag: 'BqfnanFuCe8JxvdIJZ5ZZ', post: 4, quantity: 50, tick: 1705924197816 },
{tag: '4BpTznQcnkrZ1gdYoBzO5', post: 3, quantity: 50, tick: 1705727680431 },
{tag: 'NXLKpaWtjJFSjdfQkTexw', post: 2, quantity: 50, tick: 1705413227926 },
{tag: 'NR0vIdQZAwnEjhCZWe1ca', post: 1, quantity: 50, tick: 1705246581770 },
]

let lookup = {}
for (let i = 0; i < chronology.length; i++) {
	let p = chronology[i]
	lookup[p.tag] = p
}
export const postDatabase = { lookup, chronology }



