
//library1 can import modules saved in the nuxt project's package.json above
import { now, say, see, log, sayNow } from './library0.js'
import { nanoid, customAlphabet } from 'nanoid'













//generate a new universally unique double-clickable string of 21 letters and numbers
export function unique() {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
	const length = 21//same default nanoid length
	const generator = customAlphabet(alphabet, length)
	return generator()
}












