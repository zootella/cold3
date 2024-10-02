
import { log, test, ok, noop } from './library0.js'

/*
expeditionary notes
map complete plans out here before you change code
*/


/*
~~~~~~~~ switch to yarn
*/









/*
~~~~~~~~ use axios
*/
















/*
~~~~~~~~ use redact method 2
*/

/*
const _quote = '"'
const _slashQuote = '\\"'//the string literal \" those two characters, slash escaped by slash
export function redact(s) {
	let remaining = s
	let processed = ''
	let i1, i2, i3, i4, peek, q
	// 'before "SOME_SECRET":"secret value" after'
	//  ----------->i1      .             .
	//  ------------------->i2            .
	//  -------------------->i3           .
	//  --------------------------------->i4
	while (remaining.length) {//loop redacting secret values, moving text from the start of remaining to the end of processed
		i1 = i2 = i3 = i4 = -1
		i1 = remaining.indexOf(_secretSuffix)//find the next secret suffix
		if (i1 >= 0) {
			i2 = remaining.indexOf(':', i1+_secretSuffix.length)//beyond the suffix, find the first colon
			if (i2 >= 0) {
				peek = remaining.slice(i2+1).trimStart()//peek at what's bounding the secret value
				if      (peek.startsWith(_quote))      q = _quote
				else if (peek.startsWith(_slashQuote)) q = _slashQuote
				else                                   q = ''
				if (q.length) {//found q as quote or slash quote
					i3 = remaining.indexOf(q, i2+q.length)//beyond the colon, find the opening quote or slash quote
					if (i3 >= 0) {
						i4 = remaining.indexOf(q, i3+q.length)//beyond that, find the closing quote or slash quote, bounding the secret value we'll redact
					}
				}
			}
		}
		if (i1 >=0 && i2 >=0 && i3 >= 0) {//found everything
			processed += remaining.slice(0, i3+q.length) + redact_composeReplacement(remaining.slice(i3+q.length, i4)) + q
			remaining = remaining.slice(i4+q.length)
		} else {//nothing more to redact
			processed += remaining
			remaining = ''//blank remaining to indicate we're done, and leave the while loop
		}
	}
	return processed
}
test(() => {
	let o = {
		a: 'apple',
		b: 2,
		SOME_SECRET: 'secret value',
		SECOND_SECRET: 'private value which is longer',
		c: 'carrot'
	}
	let s = JSON.stringify(o); let sr = redact(s)
	let l      = look(o);           let lr      = redact(l)

	ok(sr.includes(o.c))
	ok(!sr.includes(o.SOME_SECRET))
	ok(!sr.includes(o.SECOND_SECRET))

	ok(lr.includes(o.c))
	ok(!lr.includes(o.SOME_SECRET))
	ok(!lr.includes(o.SECOND_SECRET))

	let o2 = {
		d: 'dandelion',
		message: l,
		THIRD_SECRET: 'secret value number three',
		f: 17
	}
	let s2 = JSON.stringify(o2)
	let r2 = redact(s2)
	log(s2, r2)


	let k1 = 'here is something \\"'
	let k2 = "here is something \\\""
	log(look(k1), look(k2))












})





//cover secret values with thick black marker
export function redact_previousDesign(s) {
	redact_getSecretValues().forEach(v => {//three helper functions, split out below to be tested independently
		let r = redact_composeReplacement(v)
		s = replaceAll(s, v, r)
	})
	return s
}
function redact_getSecretValues() {//collect all values market secret from the environment we're running in
	let secrets = new Set()//a set will ignore duplicates we add

	//collect secrets from node and lambda environments
	if (defined(typeof process)) redact_getSecretValues_from(secrets, process.env)

	//collect secrets from a cloudflare worker environment
	let workerEnvironmentVariables = getWorkerEvent().context?.cloudflare?.env
	if (workerEnvironmentVariables) redact_getSecretValues_from(secrets, workerEnvironmentVariables)
	//in a cloudflare worker, you can look up process.env.something, but you can't list or loop through process.env
	//but also, cloudflare pins all of them to workerEvent.context.cloudflare.env, so we get the list that way

	return Array.from(secrets)//we used a set to prevent duplicates, but now it's easier if it's just an array
}
function redact_getSecretValues_from(destinationSet, sourceObject) {
	for (let k in sourceObject) {//loop through each key k
		if (k.endsWith('_SECRET')) {//this key name ends with secret, indicating it's something we should redact
			let v = sourceObject[k]//get the secret value v
			destinationSet.add(v)//add it, if it's a unique new one, to the given destination set
		}
	}
}
noop(() => {
	let where = Sticker().where
	if (where == 'LocalVite' || where.includes('Page')) {
	} else {//if this test is running from code that is not rendering a page
		ok(redact_getSecretValues().length > 4)//then it should have secrets, probably 6+, but make sure there are at least 4
	}
})




*/


