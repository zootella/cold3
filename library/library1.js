
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




//bookmark, the start of data for the 500 dummy posts
noop(() => {


	let n = now()
	let when = n
	let earlier
	let s = ''
	for (let i = 500; i >= 1; i--) {
		earlier = randomBetween(5*Time.minute, 5*Time.day)
		when -= earlier
		s += `\r\ntag ${tag()}, post ${i}, tick ${n} (${sayWhenPage(when)}, ${sayWhenFeed(when, n)})`


	}
	log(s)
})





