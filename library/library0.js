
//no imports allowed in library0! if you need one, go to library1












//  _   _               _            _       
// | |_(_)_ __  _   _  | |_ ___  ___| |_ ___ 
// | __| | '_ \| | | | | __/ _ \/ __| __/ __|
// | |_| | | | | |_| | | ||  __/\__ \ |_\__ \
//  \__|_|_| |_|\__, |  \__\___||___/\__|___/
//              |___/                        

const tests = []
let assertionsPassed, assertionsFailed, testsThrew
export function test(f) {
	tests.push(f)
}
export function ok(assertion) {
	if (assertion) {
		assertionsPassed++
	} else {
		assertionsFailed++
		let m = 'Test not ok, second line number expanded below:'
		console.error(m)
		return m
	}
}
export function runTests() {
	assertionsPassed = 0
	assertionsFailed = 0
	testsThrew = 0
	for (let i = 0; i < tests.length; i++) {
		try {
			tests[i]()
		} catch (e) {
			testsThrew++
			console.error(e)
			return e
		}
	}
	if (assertionsFailed || testsThrew) {
		let m = `❌ 🠕🠕🠕 Tests failed 🠕🠕🠕 ❌`
		console.error(m)
		return m
	} else {
		let m = `✅ ${sayNow()} ~ ${assertionsPassed} assertions in ${tests.length} tests all passed ✅`
		console.log(m)
		return m
	}
}








//       _                           _        _     
//   ___| | ___ _ __ ___   ___ _ __ | |_ __ _| |___ 
//  / _ \ |/ _ \ '_ ` _ \ / _ \ '_ \| __/ _` | / __|
// |  __/ |  __/ | | | | |  __/ | | | || (_| | \__ \
//  \___|_|\___|_| |_| |_|\___|_| |_|\__\__,_|_|___/
//                                                 

export const noop = (() => {})//no operation, a function that does nothing
export const newline = "\r\n"//a valid newline on unix and windows

export const Time = {}
Time.second = 1000//number of milliseconds in a second
Time.minute = 60*Time.second//number of milliseconds in a minute
Time.hour = 60*Time.minute
Time.day = 24*Time.hour
Time.week = 7*Time.day
Time.year = Math.floor(365.25 * Time.day)
Time.month = Math.floor((Time.year) / 12)

export const Size = {}
Size.b  = 1//one byte
Size.kb = 1024*Size.b//number of bytes in a kibibyte, a kilobyte would be 1000 instead of 1024
Size.mb = 1024*Size.kb//number of bytes in a mebibyte
Size.gb = 1024*Size.mb//gibibyte
Size.tb = 1024*Size.gb//tebibyte
Size.pb = 1024*Size.tb//pebibyte, really big












//  _                                                         
// | |_ ___  ___ ___    __ _ _ __     ___ _ __ _ __ ___  _ __ 
// | __/ _ \/ __/ __|  / _` | '_ \   / _ \ '__| '__/ _ \| '__|
// | || (_) \__ \__ \ | (_| | | | | |  __/ |  | | | (_) | |   
//  \__\___/|___/___/  \__,_|_| |_|  \___|_|  |_|  \___/|_|   
//                                                           

export function toss(note, watch) {//prepare your own watch object with named variables you'd like to see
	let s = `toss ${sayNow()} ~ ${note} ${see(watch)}`
	console.error(s)
	if (watch) console.error(watch)
	throw new Error(s)
}

//  _               _          _   _            
// | | ___   __ _  | |__   ___| |_| |_ ___ _ __ 
// | |/ _ \ / _` | | '_ \ / _ \ __| __/ _ \ '__|
// | | (_) | (_| | | |_) |  __/ |_| ||  __/ |   
// |_|\___/ \__, | |_.__/ \___|\__|\__\___|_|   
//          |___/                               

let logRecord = "";//all the text log has logged
const logRecordLimit = 256*Size.kb;//until its length reaches this limit
export function getLogRecord() { return logRecord }
export function log(...a) {
	let s = ''//compose some nice display text
	if (a.length == 0) {//no arguments, just the timestamp
	} else if (a.length == 1) {//timestamp and the one argument
		s = say(a[0])
	} else {//timestamp and newlines between multiple arguments
		a.forEach(e => { s += newline + say(e) })
	}
	let display = sayNow() + ' ~' + (s.length ? (' ' + s) : '')
	console.log(display)

	//append to the log record
	logRecord += (logRecord.length ? newline : '') + display//don't start with a blank line
	if (logRecord.length > logRecordLimit) logRecord = 'early logs too long to keep ~';
}

//                                    _                 
//  ___  __ _ _   _    __ _ _ __   __| |  ___  ___  ___ 
// / __|/ _` | | | |  / _` | '_ \ / _` | / __|/ _ \/ _ \
// \__ \ (_| | |_| | | (_| | | | | (_| | \__ \  __/  __/
// |___/\__,_|\__, |  \__,_|_| |_|\__,_| |___/\___|\___|
//            |___/                                     

export function say(...a) {//turn anything into text, always know you're dealing with a string
	let s = '';
	for (let i = 0; i < a.length; i++) {
		s += (i ? ' ' : '') + (a[i]+'');//spaces between, not at the start
	}
	return s;
}
/*
TODO
see is too confusing; your planned replacement will be called inspect
so then the core functions are log, say, and inspect
*/
export function see(...a) {//see into things, including key name, type, and value
	let s = ''
	for (let i = 0; i < a.length; i++) {
		s += (a.length > 1 ? newline : '') + _see2(a[i])//put multiple arguments on separate lines
	}
	return s
}
function _see2(o) {
	let s = ''
	if (o instanceof Error) {
		s = '(error) ' + o.stack//errors have their information here
	} else if (Array.isArray(o)) {
		s = `(array) [${o}]`
	} else if (typeof o == 'object') {
		s += '(object) {'
		let first = true
		for (let k in o) {
			if (!first) { s += ', ' } else { first = false }//separate with commas, but not first
			s += `${k} (${typeof o[k]}) ${_see3(o[k])}`
		}
		s += '}'
	} else {
		s = `(${typeof o}) ${_see3(o)}`
	}
	return s
}
function _see3(o) {
	try {
		return JSON.stringify(o, null)//single line
	} catch (e) { return '(circular reference)' }//watch out for circular references
}
test(() => {
	ok(say() == '')
	ok(say('a') == 'a')
	ok(say('a', 'b') == 'a b')
	ok(say(7) == '7')
	let o = {};
	ok(say(o.notThere) == 'undefined')
})
test(() => {
	ok(see() == '')
	ok(see("a") == '(string) "a"')
	ok(see(5) == '(number) 5')
	ok(see({}) == '(object) {}')
})
test(() => {
	//uncomment to try out look
	/*
	let b = true
	let s = 'hello'
	let n = 721
	let a = ["p", "q", "r"]
	let o = {
		name: 'apple',
		quantity: 11,
		f: (()=>{}),
		below: {
			block: 'bedrock'
		}
	}
	let e = (() => {
		let o = {}
		try {
			o.notThere.andBeyond
		} catch (e) {
			return e
		}
	})()
	log(see(b, s, n, a, o, e))
	log(see(b, s, {n, a, o, e}))
	*/
})
/*
todo, javascript is so wonky it's hard to make a see that lets you easily look inside
here are some possible improvements
get things on multiple lines and indent them 2 spaces
there's lots of:

ok (boolean) true
n (number) 7
responseText (string) ""
clone (function) undefined
o (object) {message (string) "hello"...}
a (array) [1,2,3]

shorten this so it's just:

ok: true,
n: 7,
responseText: "",
clone(),
o {
	message: "hello"
	...
},
a [1,2,3]

because json stringify skips functions, you'll probably have to write your own recursive walker and indenter
and that's fine, go three levels deep by default

moar notes for your return to this bike shed:

remove look(o), instead you have to call log(see(o))

remove the multiple loggers feature
you want icarus, but will do that later as a separate system
that system will have auto refresh
in-place traffic lights
and an in-place log that is maybe icarus()

you just remembered that log shouldn't turn everything into a string
doing so breaks the inspector's > arrow
this may also be why earlier log didn't tickstamp
if log gets a single string, do it all on one line
if log gets a single non-string, or multiple anything, call console.log multiple times for multiple lines
*/









//  _   _      _    
// | |_(_) ___| | __
// | __| |/ __| |/ /
// | |_| | (__|   < 
//  \__|_|\___|_|\_\
//                 

//turn a tick count into text like 'Sat 15h 49m 55.384s'
export function sayTick(tick) {
	if (!tick) return '(not yet)';//don't render 1970jan1 as a time something actually happened
	let date = new Date(tick);//create a date object using the given tick count
	let weekday = date.toLocaleDateString('en-US', { weekday: 'short' });//get text like 'Mon'
	let hours = date.getHours();//extract hours, minutes, seconds, and milliseconds
	let minutes = date.getMinutes();
	let seconds = date.getSeconds();
	let milliseconds = date.getMilliseconds().toString().padStart(3, '0');
	return `${weekday} ${hours}h ${minutes}m ${seconds}.${milliseconds}s`;
}
export function sayNow() { return sayTick(now()) }
export const now = Date.now;//just a shortcut



export function jsonStringify(o) {
	/*
//watch out for a circular reference
try {
return JSON.stringify(o, null)//single line
} catch (e) { return '(circular reference)' }//watch out for circular references
*/
}

export function jsonParse(s) {
	/*
//watch out for a blank body
//get the text first, and keep that, too

r.responseText = await response.text()//might be nothing, even on success
if (r.responseText) r.responseData = JSON.parse(r.responseText)//throws if you give it nothing
*/

}







/*
2024may16
dustiest corner of the bike shed
make sure your log and see plan is good before you go back in there
-get rid of log destinations
-do program an indented deep object sayer
-dont use it when there's a browser inspector which has arrows




*/




/*
2024apr26
code encoding, some bikeshedding

[]from separate project entry point, Ctrl+S leads to green or red check on page

library0 ~

[]base16 data
[]base64 data
[]base62 data, your code
[]base62 integer, chatGPT's code

[]round trip check
[]toss on failure
[]speed test your base62 with the browser's base64

library1 ~

[]random 1-9
[]random 0-9
[]random 0-9 A-Z a-z

not in scope for this first pass:
-page rendered width analysis
-unicode search for narrow accents that still render
-unified chinese base256



more bikeshedding here, but what if log worked like this
log(a)
turns a into text, and prefixes it with the timestamp
log(a, b)
not sure anymore
the thing you forgot when designing this refactor above was that in the browser, you don't want everything text, because the browser inspector has arrows to go deep into nested objects, which you won't code yourself, and which is incredible


*/


/*
moar notes and ideas

instead of see doing lines like
(string) s "hello"
all you need is "hello" because quotes mean string
{object}
[array]
"string"
7 with no punctuation is a number
true with no punctuation is a boolean


you made the separte vite entry point
but now nuxt localhost:3000/test is working so well you don't need it(?)
like, it's just as fast
and you can Ctrl+S library0.js several times in a row and it refreshes each time
and, the text stays in place on the page, and also scrolls down in the console
so, what more is there to do here?
i guess refactor it so you don't have log destinations anymore

*/



/*

2014may17 hopefully good thinking on finishing off this bike shed

inspect
if you want to inspect an object directly, and y ou know you're in the browser inspector, just use console.log directly
your function inspect() is new, replaces lots of old stuff, and works like this
doesn't log anything, always returns a string
string is always indented, never tries to be single line
doesn't return a tick count, obviously
better than json stringify and node util inspect, actually gets the functions and stuff those miss
always indents by two spaces
goes deep, stopping at 2k of text output
uses 7 number, true boolean, "string", [array], {object}, function()
if you want to see the name of an object, you have to wrap like inspect({object})
test with exception objects
you're going to use inspect to see what third party rest apis are telling your worker

log
starts with timestamp and tilde
logs to record and console.log
turns everything into text, always, using say
keeps everything on one line, always
doesn't call inspect, ever--you have to call that manually

say
turns directly into text, succicently--inspect is the verbose and deep one







*/



export function inspect(...a) {
	let s = ''
	for (let i = 0; i < a.length; i++) {
		s += (a.length > 1 ? newline : '') + _inspect2(a[i])//put multiple arguments on separate lines
	}
	return s
}
function _inspect2(o) {
	let s = ''
	if (o instanceof Error) {
		s = o.stack//errors have their information here
	} else if (Array.isArray(o)) {
		s = `[${o}]`
	} else if (typeof o == 'function') {
		s = o.toString()
	} else if (typeof o == 'object') {
		s += '{'
		let first = true
		for (let k in o) {
			if (!first) { s += ', ' } else { first = false }//separate with commas, but not first
			s += `${k}: ${_inspect3(o[k])}`
		}
		s += '}'
	} else {//boolean like true, number like 7, string like "hello"
		s = _inspect3(o)
	}
	return s
}
function _inspect3(o) {
	try {
		return JSON.stringify(o, null)//single line
	} catch (e) { return '(circular reference)' }//watch out for circular references
}
/*
TODO never add these additional features, because this bike shed is fancy enough:
-recurse, indenting two spaces, stopping if the text grows above 2kb
-deal with tabs and newlines in function definitions and the error stack trace
-show short arrays and objects on a single line; long ones on multiple indented lines
-say the length of a very long array, showing starting and ending items with an ellipsis in the middle

short notes relevant to those never-do improvements
stack trace lines start with four spaces, maybe just remove them
spaces and tabs in function code come through, maybe trim them and separate with the pilcrow
*/
test(() => {
	//comment to see inspect in action
	return

	log(inspect(true))//boolean
	log(inspect(7))//number
	log(inspect('hello'))//string
	log(inspect(['a', 'b', 'c']))//array
	log(inspect({key1: 'value1', key2: 'value2'}))//object

	let f1 = function namedFunction() {
		let i = 7
		return 'named function result'
	}
	let f2 = function() { return 'anonymous function result' }
	log(inspect(f1))//function
	log(inspect(f2))//function

	try {
		notDefined
	} catch (e) {
		log(inspect(e))//error with stack trace
	}
})





export function earlierSee(...a) {//see into things, including key name, type, and value
	let s = ''
	for (let i = 0; i < a.length; i++) {
		s += (a.length > 1 ? newline : '') + _earlierSee2(a[i])//put multiple arguments on separate lines
	}
	return s
}
function _earlierSee2(o) {
	let s = ''
	if (o instanceof Error) {
		s = '(error) ' + o.stack//errors have their information here
	} else if (Array.isArray(o)) {
		s = `(array) [${o}]`
	} else if (typeof o == 'object') {
		s += '(object) {'
		let first = true
		for (let k in o) {
			if (!first) { s += ', ' } else { first = false }//separate with commas, but not first
			s += `${k} (${typeof o[k]}) ${_earlierSee3(o[k])}`
		}
		s += '}'
	} else {
		s = `(${typeof o}) ${_earlierSee3(o)}`
	}
	return s
}
function _earlierSee3(o) {
	try {
		return JSON.stringify(o, null)//single line
	} catch (e) { return '(circular reference)' }//watch out for circular references
}
test(() => {
	ok(earlierSee() == '')
	ok(earlierSee("a") == '(string) "a"')
	ok(earlierSee(5) == '(number) 5')
	ok(earlierSee({}) == '(object) {}')
})





















