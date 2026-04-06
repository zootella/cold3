
import {//from wrapper
wrapper,
} from './wrapper.js'

//level0 functions work anywhere javascript does (well, current browsers and node20+), and without any module imports!



//  _   _               _            _       
// | |_(_)_ __  _   _  | |_ ___  ___| |_ ___ 
// | __| | '_ \| | | | | __/ _ \/ __| __/ __|
// | |_| | | | | |_| | | ||  __/\__ \ |_\__ \
//  \__|_|_| |_|\__, |  \__\___||___/\__|___/
//              |___/                        

export const noop = (() => {})//no operation, a function that does nothing

let _passes
const _tests = []//presenting, tiny tests! all you need for blissful TDD, and in half a screenful of code
export function test(f) { _tests.push(f) }
export function ok(assertion) {
	if (assertion) _passes++//count another passed assertion
	else throw new TestError()//the assertion is false! throw an exception to get the line number and stop the tests
}
export function bad(f) {//assert that calling f() throws; useful for testing that invalid input is rejected
	let threw = false
	try { f() } catch(e) { threw = true }
	ok(threw)
}
export async function runTests(tests) {
	if (!tests) tests = _tests//default isomorphic test cases if the caller didn't pass in their own

	_passes = 0
	let results = {}
	let t = Now()

	let failure
	for (let i = 0; i < tests.length; i++) {
		try {
			await tests[i]()//run this test to see if it throws, or any call to ok got false
		} catch (e) {
			console.error(e)//also send a red message to the browser inspector
			return {
				success: false,
				time:    t,
				error:   e,
				message: `${look(e)}${newline}on ${sayTick(t)}` 
			}
		}
	}
	let duration = Date.now() - t//can't use Now() because grid tests simulated long sleeps 😴
	return {
		success:  true,
		time:     t,
		passes:   _passes,
		tests:    tests.length,
		duration: duration,
		message:  `✅ ${_passes} assertions in ${tests.length} tests all passed in ${duration}ms on ${sayTick(t)}`
	}
}

//  _   _                
// | |_(_)_ __ ___   ___ 
// | __| | '_ ` _ \ / _ \
// | |_| | | | | | |  __/
//  \__|_|_| |_| |_|\___|
//                       

let _simulationMode
export function enterSimulationMode() { _simulationMode = true }
export function isInSimulationMode() { return _simulationMode }

let _simulationDelay = 0
export function Now() { return Date.now() + _simulationDelay }
export function ageNow(delay) {
	if (!_simulationMode) toss('mode')
	checkInt(delay)
	_simulationDelay += delay//move the clock forward by delay milliseconds to test expiration
}

//say a tick count like "2024sep09" in UTC, for logs and staff
export function sayDate(t) {
	let d = new Date(t)
	let year = d.getUTCFullYear()
	let month = Time.months.oneToJan[d.getUTCMonth()+1].toLowerCase()
	let day = d.getUTCDate().toString().padStart(2, '0')
	return `${year}${month}${day}`
}

//say a tick count like "Fri04:09p39.470s" using the local offset in the wrapper, for logs and staff
export function sayTick(t) {
	if (!t) return '(not yet)'//don't render 1970jan1 as a time something actually happened
	let d = new Date(t - wrapper.local)//offset manually, then we'll use UTC methods below
	let weekday = d.toUTCString().slice(0, 3)
	let hours = (d.getUTCHours() % 12 || 12).toString().padStart(2, '0')//convert hours 0-23 to 1-12
	let meridiem = d.getUTCHours() < 12 ? 'a' : 'p'
	let minutes = d.getUTCMinutes().toString().padStart(2, '0')
	let seconds = d.getUTCSeconds().toString().padStart(2, '0')
	let milliseconds = d.getUTCMilliseconds().toString().padStart(3, '0')
	return `${weekday}${hours}:${minutes}${meridiem}${seconds}.${milliseconds}s`
}

//  _                
// | |_ ___  ___ ___ 
// | __/ _ \/ __/ __|
// | || (_) \__ \__ \
//  \__\___/|___/___/
//                   

export function toss(message, watch) { throw new TossError(message, watch) }//use like toss('title', {watch1, watch2}) with watch variables for context

class TestError extends Error {
	constructor() {
		super('test')
		this.name = 'TestError'//you have to set this, otherwise it's just "Error"

		if (Error.captureStackTrace) Error.captureStackTrace(this, ok)//omit lines in the stack trace above the call to ok(false)
	}
}
class TossError extends Error {//custom error to identify it's one of ours, and include watch variables
	constructor(message, watch) {
		super(message)
		this.name = 'TossError'

		if (watch) this.watch = watch//the object of named watch variables
		let t = Now()
		this.when = sayTick(t)//when this happened
		this.tick = t//same tick as a number

		if (Error.captureStackTrace) Error.captureStackTrace(this, toss)
	}
}
const _customErrorKeys = [//list the Error properties we expect for look() to find them below
	'name', 'message', 'stack', 'cause',//standard JavaScript Error properties
	'task', 'watch', 'when', 'tick',//our custom additions
	'details', 'info', 'metadata',//common additional property names, and ones we might use in the future
]//ttd april2025, even though Error properties are non-enumerable, look() should just use Object.getOwnPropertyNames(e) to find them all, meaning we don't need this white list. do this alongside the better makePlain, and tests for everything

//  _             
// | | ___   __ _ 
// | |/ _ \ / _` |
// | | (_) | (_| |
// |_|\___/ \__, |
//          |___/ 

export function log(...a) { let s = composeLog(...a); logTo(console.log, s) }

function composeLog(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let arrow = s.trimEnd().includes('\n') ? ' ↓' : ' →'//point arrow down if multiple lines below
	return sayTick(Now()) + arrow + (s.length ? (' ' + s) : '')
}

const logSinks = []//more places to log, like a function that writes to a file, or a string to show on a page
export function addLogSink(f) { logSinks.push(f) }
export function logTo(sink, s) { [sink, ...logSinks].forEach(f => f(s)) }

//                                           
//   ___ ___  _ __ ___  _ __   __ _ _ __ ___ 
//  / __/ _ \| '_ ` _ \| '_ \ / _` | '__/ _ \
// | (_| (_) | | | | | | |_) | (_| | | |  __/
//  \___\___/|_| |_| |_| .__/ \__,_|_|  \___|
//                     |_|                   

//compare two simple objects
//same means same keys and values
//uses triple equals, imagining strings and numbers
//only goes one level deep
export function sameObject(o1, o2) {
	let keys1 = Object.keys(o1)
	let keys2 = Object.keys(o2)
	if (keys1.length != keys2.length) return false

	for (let key of keys1) {
		if (o1[key] !== o2[key]) {//matches missing key in one with undefined value in the other
			return false
		}
	}
	return true
}
//compare two arrays
//same means same length and values
//uses triple equals, imagining strings and numbers
export function sameArray(a1, a2) {
	if (a1.length != a2.length) return false

	for (let i = 0; i < a1.length; i++) {
		if (a1[i] !== a2[i]) {
			return false
		}
	}
	return true
}
test(() => {
	ok(sameObject({a:5, b:7}, {a:5, b:7}))
	ok(!sameObject({a:5, b:7}, {a:5, b:8}))//different value
	ok(!sameObject({a:5, b:7}, {a:5}))//missing key

	ok(!sameObject({a:5, b:7}, {a:5, b:undefined}))
	ok(!sameObject({a:5, b:undefined}, {a:5, b:7}))

	//ok, here's the corner case sameObject can't do, but to be really fast we're ok with that
	ok(!sameObject({a:5, corner:9}, {a:5, b:undefined}))//correct
	ok(sameObject({a:5, b:undefined}, {a:5, corner:9}))//incorrect, absent b in o2 matches undefined value in o1

	ok(sameArray([2, 4, 6, 8], [2, 4, 6, 8]))
	ok(!sameArray([2, 4, 6, 8], [2, 4, 7, 8]))//different value
	ok(!sameArray([2, 4, 6, 8], [2, 4, 6]))//different length
})
















//       _               _    
//   ___| |__   ___  ___| | __
//  / __| '_ \ / _ \/ __| |/ /
// | (__| | | |  __/ (__|   < 
//  \___|_| |_|\___|\___|_|\_\
//                            

/*************************************************************************/
/*                                                                       */
/*                                  (`-.                                 */
/*                                   \  `                                */
/*      /)         ,   '--.           \    `                             */
/*     //     , '          \/          \   `   `                         */
/*    //    ,'              ./         /\    \>- `   ,----------.        */
/*   ( \  ,'    .-.-._        /      ,' /\    \   . `            `.      */
/*    \ \'     /.--. .)       ./   ,'  /  \     .      `           `.    */
/*     \     -{/    \ .)        / /   / ,' \       `     `-----.     \   */
/*     <\      )     ).:)       ./   /,' ,' \        `.  /\)    `.    \  */
/*      >^,  //     /..:)       /   //--'    \         `(         )    ) */
/*       | ,'/     /. .:)      /   (/         \          \       /    /  */
/*       ( |(_    (...::)     (                \       .-.\     /   ,'   */
/*       (O| /     \:.::)                      /\    ,'   \)   /  ,'     */
/*        \|/      /`.:::)                   ,/  \  /         (  /       */
/*                /  /`,.:)                ,'/    )/           \ \       */
/*              ,' ,'.'  `:>-._._________,<;'    (/            (,'       */
/*            ,'  /  |     `^-^--^--^-^-^-'                              */
/*  .--------'   /   |                                                   */
/* (       .----'    |   *************************************************/
/*  \ <`.  \         |   */
/*   \ \ `. \        |   */  // Make sure s is a string that has some text,
/*    \ \  `.`.      |   */  // meaning it's not blank, and not just space
/*     \ \   `.`.    |   */  export function checkText(s) {
/*      \ \    `.`.  |   */    if (!hasText(s)) toss('type', {s})
/*       \ \     `.`.|   */    return s//pass the text through
/*        \ \      `.`.  */  }
/*         \ \     ,^-'  */  export function hasText(s) {
/*          \ \    |     */    return (
/*           `.`.  |     */      typeof s == 'string' &&
/*              .`.|     */      s.length &&
/*               `._>    */      s.trim() != ''
/*                       */    )
/*       g o o d w i n   */  }
/*                       */  test(() => {
/*************************/    ok(hasText('a'))

	ok(!hasText())//nothing
	ok(!hasText(''))//empty string
	ok(!hasText(' '))//just spaces
	ok(!hasText(7))//non-string
	ok(!hasText('\r\n'))//nonprinting characters
})

export function checkInt(i, m) { if (!minInt(i, m)) toss('bounds', {i, m}) }
export function minInt(i, m = 0) { // Note (0)
	return (
		i === 0 &&                     // Note (1)
		i >= m                         /* Note (2)
		Default minimum m 0 in arguments (Note 0); Negative works fine, but must specify allowed negative minimum.
		Frequently, i will be zero (1); check value and type (1), and bounds (2) quickly. */
	) || (
		Number.isInteger(i)          && // Note (3)
		i >= m                       && // Note (4)
		i <= Number.MAX_SAFE_INTEGER && // Note (5)
		/^-?[1-9]\d*$/.test(i+'')       /* Note (6)
		(3) Includes typeof i == 'number' and !isNaN(i) checks, according to MDN.
		(4) At or above the given minimum.
		(5) Small enough to stay an integer everywhere; biggest integers are:
				(2^53)-1 ==      9,007,199,254,740,991 in JavaScript;
				(2^63)-1 == 19,223,372,036,854,775,807 in a BIGINT PostgreSQL field, a signed 8 byte integer.
		(6) Plus blank for quick convert, then regular expression that:
				allows one optional minus sign at the start;
				blocks a leading zero;
				and ensures all numerals, blocking JavaScript numbers like 2.5 decimal and 5e-7 scientific notation. */
	)
}
test(() => {
	ok(minInt(0))//these are fine integers
	ok(minInt(7))

	ok(!minInt(-5))//negative
	ok(!minInt(3.14))//fractional
	ok(!minInt('potato'))//not even a number
	ok(!minInt(NaN))//that thing

	ok(minInt(0, 0))//confirming common minimums
	ok(minInt(1, 0))
	ok(minInt(1, 0))
	ok(minInt(1, 1))
	ok(minInt(10, 5))

	ok(!minInt(0, 1))//doesn't reach the minimum
	ok(!minInt(3, 5))
})

//use when you don't just need if truthy, you really need the type boolean
export function toBoolean(r) { return r ? true : false }
//use like toTextOrBlank(something?.deeper?.maybe) to get the text there or blank--always returns a string!
export function toTextOrBlank(r) { return hasText(r) ? r : '' }

export function intToText(i, m = 0) { return _intToText(i, m, true) }//default minimum zero, or pass custom minimum like 1 or -1
export function textToInt(s, m = 0) { return _textToInt(s, m, true) }
function _intToText(i, m, trip) {//true to check conversion in a round trip
	checkInt(i, m)//check minimum, starting with given number
	let s = i+''//convert
	if (trip) checkSame(i, _textToInt(s, m, false))//check round trip
	return s
}
function _textToInt(s, m, trip) {
	let i = parseInt(s, 10)//convert, specify radix of base10
	if (trip) checkSame(s, _intToText(i, m, false))//check round trip
	checkInt(i, m)//check minimum, now that we have the number
	return i
}
test(() => {
	ok(textToInt('-1', -1) == -1)
	ok(textToInt('0') == 0)
	ok(textToInt('1') == 1)
})

export function checkTextOrBlank(s) { if (!hasTextOrBlank(s)) toss('type', {s}) }
export function hasTextOrBlank(s) { return typeof s == 'string' }
test(() => {

	ok(!hasText())
	ok(!hasText(5))
	ok(!hasText(''))
	ok(!hasText(' '))//hasText and checkText want a string that's not blank and not trimmable to blank
	ok(hasText('a'))

	ok(!hasTextOrBlank())
	ok(!hasTextOrBlank(5))
	ok(hasTextOrBlank(''))//hasTextOrBlank requires a string, but blank is ok
	ok(hasTextOrBlank(' '))
	ok(hasTextOrBlank('a'))
})

export function checkNumerals(s, length) {//s must be one or many numerals, optional required length
	if (!isNumerals(s, length)) toss('valid', {s})
}
export function isNumerals(s, length) {//true if s is not blank and only numerals 0-9, can start 0
	if (!hasText(s)) return false//blank or not a string
	if (!/^\d+$/.test(s)) return false//not all numerals
	if (length && s.length != length) return false//required length wrong
	return true
}
export function takeNumerals(s) {//remove all characters but the numerals 0-9
	return s.replace(/[^0-9]/g, '')
}
test(() => {
	ok(!isNumerals())
	ok(!isNumerals(''))
	ok(isNumerals('0'))
	ok(!isNumerals('0 '))

	ok(isNumerals('123', 3))
	ok(!isNumerals('123', 4))
	ok(!isNumerals('', 0))//length is correct, but is numerals needs non-blank

	ok(takeNumerals('') == '')
	ok(takeNumerals('A') == '')
	ok(takeNumerals('0123456789') == '0123456789')
	ok(takeNumerals('  012345\t6789\r\n') == '0123456789')
	ok(takeNumerals(' 0123456789 一二三 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ .-_ 🌴? yes ') == '0123456789')
})





//is the time now beyond the given tick count expiration date? 🥛 and check we always get a valid number
export function isExpired(t) {//false if t is in the future, true if t is in the past, toss if t undefined or zero
	checkInt(t, 1)
	return t < Now()
}
test(() => {
	ok(!isExpired(Now() + Time.second))
	ok(isExpired(Now() - Time.second))//normal use

	if (false) {//manually confirm these all throw
		let o = {}
		ok(isExpired(o?.expiration))
		ok(isExpired())
		ok(isExpired(undefined))
		ok(isExpired(null))
		ok(isExpired(false))//different kinds of not there
		ok(isExpired(true))
	}
})





































//given an integer seed like 12345 and a byte size, make random-looking but deterministic and repeatable data
export function mulberryData({seed, size}) {
	function rng() {//Mulberry32 is a well-known small PRNG by Tommy Ettinger from 2018
		seed += 0x6D2B79F5
		let t = seed
		t = Math.imul(t ^ t >>> 15, t | 1)
		t ^= t + Math.imul(t ^ t >>> 7, t | 61)
		return (t ^ t >>> 14) >>> 0
	}
	const a = new Uint8Array(size)
	let v = 0
	for (let i = 0; i < size; i++) {
		if (i % 4 === 0) v = rng()//generate a new 32-bit value every 4 bytes
		a[i] = (v >>> ((i % 4) * 8)) & 0xFF//extract the appropriate byte from the 32-bit value
	}
	return Data({array: a})
}

//split a long string of characters into words so it wraps nicely, none longer than max
export function cutRandomWords(s, min, max) {
	checkText(s); checkInt(min, 1); checkInt(max, min)
	let words = [], i = 0
	while (i < s.length) {
		let remaining = s.length - i
		if (remaining <= max) { words.push(s.slice(i)); break }//take the rest as final word
		let l = randomBetween(min, max)
		words.push(s.slice(i, i + l))
		i += l
	}
	return words.join(' ')
}
noop(() => {
	let l = randomBetween(10, Size.kb)
	let s = Data({random: l}).base62()
	let w = cutRandomWords(s, 10, 20)
	log(w)
	ok(w.replaceAll(' ', '') == s)//round trip, remove spaces and confirm we get the original back
})


























//      _       _          __                              _       
//   __| | __ _| |_ ___   / _| ___  _ __   _ __ ___  _   _| |_ ___ 
//  / _` |/ _` | __/ _ \ | |_ / _ \| '__| | '__/ _ \| | | | __/ _ \
// | (_| | (_| | ||  __/ |  _| (_) | |    | | | (_) | |_| | ||  __/
//  \__,_|\__,_|\__\___| |_|  \___/|_|    |_|  \___/ \__,_|\__\___|
//                                                                 

//date for route: t <--> "2002feb2" zone UTC

export function tickToDay(t) {//rounds back to the start of the day t is in
	checkInt(t)
	let date = new Date(t)
	let year = date.getUTCFullYear()//all UTC
	let month = Time.months.oneToJan[date.getUTCMonth()+1].toLowerCase()//lowercase like "jan"
	let day = date.getUTCDate()//day of the month, no starting 0
	return `${year}${month}${day}`
}
export function dayToTick(s) {
	let year = textToInt(s.slice(0, 4)); checkInt(year, 1970)//start of the Unix epoch
	let month = Time.months.janToOne[s.slice(4, 7)]; if (!month) toss('data', {s})
	let day = textToInt(s.slice(7)); checkInt(day, 1); if (day > 31) toss('data', {s})
	return Date.UTC(year, month-1, day)//returns a tick count
}
test(() => {
	let t1 = 1744387476267//tick within a day
	let t2 = 1744329600000//tick at the start of that day
	let s = '2025apr11'
	ok(tickToDay(t1) == s)
	ok(tickToDay(t2) == s)
	ok(dayToTick(s) == t2)
})
noop(() => {
	const durationSeconds = 4
	const spanYears = 30
	let checks = 0
	let now = Now()
	function f() {
		let t1 = randomBetween(now-(spanYears*Time.year), now)
		let s1 = tickToDay(t1)
		let t2 = dayToTick(s1)
		let s2 = tickToDay(t2)
		ok(s1 == s2)
	}
	while (Now() < now + (durationSeconds*Time.second)) { f(); checks++ }
	log(`round tripped ${checks} random dates spanning the past ${spanYears} years in ${durationSeconds} seconds`)
})

//      _       _          __                                     
//   __| | __ _| |_ ___   / _| ___  _ __   _ __   __ _  __ _  ___ 
//  / _` |/ _` | __/ _ \ | |_ / _ \| '__| | '_ \ / _` |/ _` |/ _ \
// | (_| | (_| | ||  __/ |  _| (_) | |    | |_) | (_| | (_| |  __/
//  \__,_|\__,_|\__\___| |_|  \___/|_|    | .__/ \__,_|\__, |\___|
//                                        |_|          |___/      

//date for page: t -> "2024 May 19 4:20 PM" and "Just now" zone from browser

let _dateFormatters//make date formatters once, and only if we need them
function getDateFormatters() {
	if (!_dateFormatters) _dateFormatters = {//undefined for the browser's local time zone; UTC in worker or lambda
		y: new Intl.DateTimeFormat(undefined, {year: 'numeric'}),
		m: new Intl.DateTimeFormat(undefined, {month: 'short'}),
		d: new Intl.DateTimeFormat(undefined, {day: 'numeric'}),
		w: new Intl.DateTimeFormat(undefined, {weekday: 'short'}),
		t: new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: 'numeric'})
	}
	return _dateFormatters
}
function _composeDate(t) {
	let d = new Date(t)
	let f = getDateFormatters()
	return {
		year:    f.y.format(d),//like '2024'
		month:   f.m.format(d),//like 'May'
		day:     f.d.format(d),//like '20'
		weekday: f.w.format(d),//like 'Mon'
		time:    f.t.format(d)//like '2:17 PM' or '14:17'
	}
}
export function sayTimePage(t) {
	let p = _composeDate(t)
	return `${p.time}`
}
export function sayWhenPage(t) {//like "2024 May 19 4:20 PM", always in that order, but localized to 12 or 24 hour from browser settings
	let p = _composeDate(t)
	return `${p.year} ${p.month} ${p.day} ${p.time}`
}
export function sayWhenFeed(t, n) {//takes a tick in the past, and the tick right now
	if (!n) n = Now()
	let age = n - t//how long ago t happened, based on the given n now
	let t2 = _composeDate(t)
	let n2 = _composeDate(n)

	if      (age <  2*Time.minute) { return 'Just now' }
	else if (age < 60*Time.minute) { return `${Math.round(age/Time.minute)}m` }
	else if (age < 24*Time.hour)   { return `${Math.round(age/Time.hour)}h` }//note that twitter says 'Yesterday' sometimes, but this function doesn't
	else if (age <  6*Time.day)    { return `${t2.weekday} ${t2.time}` }
	else if (t2.year == n2.year) { return `${t2.month} ${t2.day}` }//same year
	else { return `${t2.year} ${t2.month} ${t2.day}` }//last year or earlier
}
noop(() => {
	let t = Now()
		log(`
			${t}     - integer
			${sayTick(t)}  - sayTick

			${sayWhenPage(t)}  - sayWhenPage
			${sayWhenFeed(t)}             - sayWhenFeed

			${sayWhenFeed(t-(1*Time.minute))}     - less than 2 minutes old
			${sayWhenFeed(t-(5*Time.minute))}           - past hour
			${sayWhenFeed(t-(10*Time.hour))}          - less than 24 hours old
			${sayWhenFeed(t-(5*Time.day))}  - a recent day of the week
			${sayWhenFeed(t-(10*Time.day))}       - earlier this year
			${sayWhenFeed(t-(200*Time.day))}  - last year
		`)
})
















































//  _                  
// | | _____ _   _ ___ 
// | |/ / _ \ | | / __|
// |   <  __/ |_| \__ \
// |_|\_\___|\__, |___/
//           |___/     

export function parseKeyFile(contents) {//given file contents, split and prepare into public and secret blocks
	let o = {publicBlock: '', secretBlock: ''}
	let lines = contents.split(/\r?\n/)//works with both windows style \r\n and mac and server style just \n
	for (let line of lines) {
		let c = cut2(line, '==', '==')
		if (c.found && c.before == '' && hasText(c.middle) && hasText(c.after)) {
			let t = c.middle.split(',').map(tag => tag.trim()).sort()//array of tags
			let l = `==${t.join(',')}==${c.after.trim()}\n`//line composed for block
			if (t.includes('public') && !t.includes('server') && !t.includes('secret')) { o.publicBlock += l } else { o.secretBlock += l }
		}
	}
	return o
}
export function parseKeyBlock(block) {//given a public or secret block, parse into a list for easy lookups
	let list = []
	let lines = block.split(/\r?\n/)
	for (let line of lines) {
		let c = cut2(line, '==', '==')
		if (c.found && c.before == '' && hasText(c.middle) && hasText(c.after)) {
			let tags = c.middle.trim()
			let value = c.after.trim()
			list.push([tags, value])
		}
	}
	return list
}
export function lookupKey(list, search) {//look up the value in list from search tags like "tag1, tag2"
	let find = search.split(',').map(tag => tag.trim()).sort()
	for (let [k, v] of list) {
		let tags = k.split(',').map(tag => tag.trim()).sort()
		if (find.length == tags.length && find.every((tag, i) => tag == tags[i])) return v
	}
	return false//not found
}
export function listAllKeyValues(list) { return list.map(([k, v]) => v) }//make an array of just the values

test(() => {
let contents = `
here's an example key file
a comment is just a line that *doesn't* begin with double equals!

== key1               == value1
== key1, key2         == value2
== key1, public, page == value3
== key4, public, page == value4`

	let blocks = parseKeyFile(contents)
	ok(blocks.publicBlock.includes('value3') && blocks.publicBlock.includes('value4'))
	ok(blocks.secretBlock.includes('value1') && blocks.secretBlock.includes('value2'))
	ok(!blocks.publicBlock.includes('value1'))
	ok(!blocks.publicBlock.includes('value2'))//important to make sure can't leak!
})
test(() => {
let contents = `
== tag1               == value1
== tag2, tag3         == value2
== tag4, public, page == value4
== with space, tag2   == value5`

	let blocks = parseKeyFile(contents)
	let list = parseKeyBlock(blocks.publicBlock+blocks.secretBlock)//fine to just add blocks together because they always end \n

	ok(lookupKey(list, 'tag1')       == 'value1')//basic use
	ok(lookupKey(list, 'tag2, tag3') == 'value2')//two tags, both required, order doesn't matter
	ok(lookupKey(list, 'tag3, tag2') == 'value2')
	ok(lookupKey(list, 'tag2, with space') == 'value5')//tags can have spaces, note order still doesn't matter

	ok(!lookupKey(list, 'tag2'))//not found because must specify all identifying tags
	ok(!lookupKey(list, 'tag3'))
	ok(!lookupKey(list, 'tag5'))//not in use at all
})
//ttd december2025, you could make this simpler to not split up tags, block double spaces, and only sort public names that end ", public"; you don't need to have tags where you can reverse order, you do want seal to block setting a duplicate


























//                            _               
//  _ __  _ __ ___  _ __ ___ (_)___  ___  ___ 
// | '_ \| '__/ _ \| '_ ` _ \| / __|/ _ \/ __|
// | |_) | | | (_) | | | | | | \__ \  __/\__ \
// | .__/|_|  \___/|_| |_| |_|_|___/\___||___/
// |_|                                        

//make a once-at-a-time version g of a given async function f
//when multiple calls like await g() happen close together, only the first starts f, and they all get the first result when it's ready
//this is useful for fetch(), where multiple simultaneous calls in can share the same single result
//return values and thrown exceptions behave as if you were directly calling f!
export function sequentialShared(f) {//takes f, the async function we want to protect from overlapping calls
	let p = null//current in-flight promise, or null not running; note how p is enclosed in each call to sequentialShared(), not each call to either f or g
	let g = function(...a) {//make g, the wrapper function; use a to pass arguments from outer g to inner f
		if (!p) {//if f is not running already, start it
			p = f(...a).finally(() => {//call f and save its promise
				p = null//after return or throw, execution goes here; reset p to let the next non-overlapping call in
			})
		}
		return p//g returns the in-flight promise, which may be newly created or already pending
	}
	return g//return g, the newly created function this call to sequentialShared() wrapped around f to protect it
}

//make a once-at-a-time version g of a given async function f
//when multiple calls like await g() happen close together, each runs f, they don't overlap, they wait in line, each gets its own result
//this is useful for turnstile, where a second call should wait for the first to finish before starting its own call afterwards
export function sequentialSeparate(f) {
	let p = Promise.resolve()//p starts resolved so the first call starts right away
	let g = function(...a) {
		const r = p.then(() => f(...a))//make a new promise that waits for the previous one to finish
		p = r.catch(() => {})//update the chain, catch errors so one doesn't break future calls
		//ttd march2025, ok, but should you log these errors? or make the call that requested it, throw it at that guy?
		return r
	}
	return g
}

/*
ttd march2025, maybe
[]refactor promise stuff from door shut into functions here
[]refactor primise stuff from turnstile component into functions here
[]write generalized tests for these functions, even if they're not automated
*/

















export function sameIgnoringCase(s1, s2) {
	return s1.toLowerCase() == s2.toLowerCase()
}
export function sameIgnoringTrailingSlash(s1, s2) {
	if (s1.endsWith('/')) s1 = s1.slice(0, -1)
	if (s2.endsWith('/')) s2 = s2.slice(0, -1)
	return s1 == s2
}
test(() => {
	ok(sameIgnoringCase('origin', 'Origin'))
	ok(sameIgnoringTrailingSlash('https://example.com/', 'https://example.com'))
})








//sanity checking this as you use these getting data out of the database
test(() => {
	function t(x) { if (x); else ok(false) }//if (x) must work
	function f(x) { if (x) ok(false)}//if (x) must not work

	t(true)
	t([])//empty arrays and objects are also true, because the container is there
	t({})

	f(false)
	f(undefined)//undefined and null are also false
	f(null)

	t('hi')//text is true
	f('')//to your surprise just now, a blank string is false!
})






/*
ttd february2025

write a helper function which takes a hash value
and turns it into text like "user00ff00ff00ff"
this is to show the use rin a unique way
we'll use it to show them their browser tag and user tag



*/







//round down integer i to the nearest whole unit of d
export function roundDown(i, d) {
	checkInt(i); checkInt(d, 1)
	return (Math.floor(i / d)) * d
}
test(() => {
	ok(roundDown(10, 3) == 9)
})









export function commas(s, thousandsSeparator) {//pass comma, period, or leave out to get international ready thin space
	s += ''//turn numbers into strings
	if (!thousandsSeparator) thousandsSeparator = ','
	let minus = ''
	if (s.startsWith('-')) { minus = '-'; s = s.slice(1) }//deal with negative numbers
	if (s.length > 4) {//let a group of four through
		s = s.split('').reverse().join('')//reversed
		s = s.match(/.{1,3}/g).join(thousandsSeparator)//grouped reverse
		s = s.split('').reverse().join('')//forward again
	}
	return minus+s
}
test(() => {
	ok(commas('') == '')
	ok(commas('1234') == '1234')
	ok(commas('12345') == '12,345')
	ok(commas('-50') == '-50')
	ok(commas('-70800') == '-70,800')
})



export function anyIncludeAny(strings, tags) {//true if any string contains any tag, matching case
	for (let s of strings) {
		if (!hasText(s)) continue//if an undefined makes it in here, it's just not a match
		s = s.toLowerCase()
		for (let t of tags) {
			if (!hasText(t)) continue
			if (s.includes(t.toLowerCase())) return true
		}
	}
	return false
}
test(() => {
	ok(anyIncludeAny(['red green blue'], ['green']))
	ok(!anyIncludeAny(['red green blue'], ['purple']))
	ok(anyIncludeAny(['red green blue'], ['orange', 'Red']))

	ok(!anyIncludeAny(['a b', 'c d'], ['e']))
	ok(anyIncludeAny(['a b', 'c d'], ['e', 'C']))
})












export function sample1() {
	return 'hello from sample1 in icarus level0'
}
