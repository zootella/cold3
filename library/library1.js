
//library1 can import modules saved in the nuxt project's package.json above
import { test, ok, now, say, inspect, log } from './library0.js'
import { customAlphabet } from 'nanoid'






//generate a new universally unique double-clickable tag of 21 letters and numbers
export function tag() {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
	return customAlphabet(alphabet, 21)()//same default nanoid length
}

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









