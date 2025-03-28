
//not a part of what get's tested or built; a recycle bin for code you probably don't need

export function start(s, n)  { return clip(s, 0, n) }            // Clip out the first n characters of s, start(s, 3) is CCCccccccc	
export function end(s, n)    { return clip(s, s.length - n, n) } // Clip out the last n characters of s, end(s, 3) is cccccccCCC	
export function beyond(s, i) { return clip(s, i, s.length - i) } // Clip out the characters beyond index i in s, beyond(s, 3) is cccCCCCCCC	
export function chop(s, n)   { return clip(s, 0, s.length - n) } // Chop the last n characters off the end of s, chop(s, 3) is CCCCCCCccc	
export function clip(s, i, n) {                                  // Clip out part of s, clip(s, 5, 3) is cccccCCCcc
	if (i < 0 || n < 0 || i + n > s.length) toss('bounds', {s, i, n})
	return s.slice(i, i + n);
}

export function has(s, t)    { return                      findFirst(s, t) != -1 } // True if s contains t
export function starts(s, t) { return _mightStart(s, t) && findFirst(s, t) == 0 } // True if s starts with t
export function ends(s, t)   { return _mightEnd(s, t)   && findLast(s, t) == s.length - t.length } // True if s ends with t

export function cut(s, t)     { return _cut(s, t, findFirst(s, t)) } // Cut s around t to get what's before and after
export function cutLast(s, t) { return _cut(s, t, findLast(s, t)) } // Cut s around the last place t appears to get what's before and after
function _cut(s, t, i) {
	if (i == -1) {
		return { found: false, before: s, tag: '', after: '' }
	} else {
		return {
			found:  true, // We found t at i, clip out the text before and after it
			before: start(s, i),
			tag:    clip(s, i, t.length), // Include t to have all parts of s
			after:  beyond(s, i + t.length)
		}
	}
}
// Keep starts() and ends() from making indexOf() scan the whole thing if the first character doesn't even match
function _mightStart(s, t) { return s.length && t.length && s.charAt(0)            == t.charAt(0) }
function _mightEnd(s, t)   { return s.length && t.length && s.charAt(s.length - 1) == t.charAt(t.length - 1) }
// Don't give indexOf() blank strings, because somehow "abc".indexOf("") is 0 first not -1 not found
export function findFirst(s, t) { if (s.length && t.length) { return s.indexOf(t)     } else { return -1 } }
export function findLast(s, t)  { if (s.length && t.length) { return s.lastIndexOf(t) } else { return -1 } }

// In a single pass through s, replace whole instances of t1 with t2
export function swap(s, t1, t2) {
	let s2 = ''          // Target string to fill with text as we break off parts and make the replacement
	while (s.length) {   // Loop until s is blank, also makes sure it's a string
		let c = cut(s, t1) // Cut s around the first instance of the tag in it
		s2 += c.before     // Move the part before from s to done
		if (c.found) s2 += t2
		s = c.after
	}
	return s2
}
//ttd march, swap is in drawer, but you don't need it because you have replaceAll

// Parse out the part of s between t1 and t2
export function between(s, t1, t2) {
	let c1 = cut(s,        t1)
	let c2 = cut(c1.after, t2)
	if (c1.found && c2.found) {
		return {
			found:     true,
			before:    c1.before,
			tagBefore: c1.tag,
			middle:    c2.before,
			tagAfter:  c2.tag,
			after:     c2.after
		}
	} else {
		return { found: false, before: s, tagBefore: '', middle: '', tagAfter: '', after: '' }
	}
}

test(() => {
	let s = 'abcdefghij'
	ok(start(s, 3) == 'abc')
	ok(end(s, 3) == 'hij')
	ok(beyond(s, 3) == 'defghij')
	ok(chop(s, 3) == 'abcdefg')
	ok(clip(s, 1, 2) == 'bc')

	ok(has(s, 'def'))
	ok(!has(s, 'deg'))
	ok(starts(s, 'abc'))
	ok(!starts(s, 'abd'))
	ok(ends(s, 'hij'))
	ok(!ends(s, 'hik'))
})
test(() => {
	ok(swap('a blue balloon in a blue sky', 'blue', 'red') == 'a red balloon in a red sky')

	let p = between('with <i>emphasis</i> added', '<i>', '</i>')
	ok(p.found)
	ok(p.before == 'with ')
	ok(p.middle == 'emphasis')
	ok(p.after == ' added')
})





























