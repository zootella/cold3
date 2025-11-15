
import {//from wrapper
wrapper,
} from './wrapper.js'
import {//from level0
Time,
Now, sayDate, sayTick,
noop, test, ok, toss, checkInt, hasText, Size,
checkNumerals, takeNumerals,
log,
say, look, defined,
checkText,
tagLength, Tag, checkTagOrBlank, checkTag, hasTag,
Bin, Data, checkSizeStartEnd, randomBetween, mulberryData,
cut,
fraction, exponent, int, big, deindent, newline,
hashText, given,
makePlain, makeObject, makeText,
totpGenerate,
} from './level0.js'

//from npm
import {z as zod} from 'zod'//use to validate email
import creditCardType from 'credit-card-type'//use to validate card; from Braintree owned by PayPal
import {parsePhoneNumberFromString} from 'libphonenumber-js'//use to validate phone; from Google for Android
import isMobile from 'is-mobile'//use to guess if we're in a mobile browser next to an app store
import {getAddress as viem_getAddress} from 'viem'

//from node
let module_node
async function loadNode() {//for calls from lambda and local node testing; don't call from web worker or page, will throw
	if (!module_node) {
		module_node = {
			fs:     await import('node:fs'),
			stream: await import('node:stream'),
			//note that crypto is not here because Node exposes it under crypto.subtle matching the browser API
		}
	}
	return module_node
}

/*
notes about imports:
- modules promise isomorphic but then don't deliver: test in node, browser, and web worker SSR
- some of these are still CommonJS, and then you have to look for .default
- static imports above mean functions that use these don't have to be async, but the initial bundle size is larger
- switching some to dynamic could save bundle size, but would spread async up the call tree
- code for a dynamic import must name the module as a string literal argument, otherwise the bundler won't know to include it!
*/

















//                                          _                   
//  ___  __ _ _   _   _ __  _   _ _ __ ___ | |__   ___ _ __ ___ 
// / __|/ _` | | | | | '_ \| | | | '_ ` _ \| '_ \ / _ \ '__/ __|
// \__ \ (_| | |_| | | | | | |_| | | | | | | |_) |  __/ |  \__ \
// |___/\__,_|\__, | |_| |_|\__,_|_| |_| |_|_.__/ \___|_|  |___/
//            |___/                                             

//use to say "5 things" like `${n} thing${sayPlural(n)}`
export function sayPlural(i) {
	return i == 1 ? '' : 's'
}
test(() => {
	ok(sayPlural(0) == 's')//like "0 carrots"
	ok(sayPlural(1) == '') //like "1 carrot"
	ok(sayPlural(2) == 's')//like "2 carrots"
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

//say a huge integer like "802 billion"
const _magnitudes = ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion', ' decillion']
export function sayHugeInteger(i) {
	let b = big(i)
	let u = 0
	while (b >= 1000n && u < _magnitudes.length - 1) {
		b /= 1000n
		u++
	}
	return `${commas(b)}${_magnitudes[u]} year${sayPlural(i)}`
}

// Describe big sizes and counts in four digits or less
export function saySize4(n)   { return _number4(n, 1024, [' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB']) }
export function sayNumber4(n) { return _number4(n, 1000, ['',       ' K',  ' M',  ' B',  ' T',  ' P',  ' E',  ' Z',  ' Y'])  }
function _number4(n, power, units) {
	let u = 0 // Start on the first unit
	let d = 1 // Which has a value of 1 each
	while (u < units.length) { // Loop to larger units until we can say n in four digits or less

		let w = Math.floor(n / d) // Find out how many of the current unit we have
		if (w <= 9999) return w + units[u] // Four digits or less, use this unit

		u++ // Move to the next larger unit
		d *= power
	}
	return n+'' // We ran out of units
}

















//       _                          _                
//   ___| |__   __ _ _ __ __ _  ___| |_ ___ _ __ ___ 
//  / __| '_ \ / _` | '__/ _` |/ __| __/ _ \ '__/ __|
// | (__| | | | (_| | | | (_| | (__| ||  __/ |  \__ \
//  \___|_| |_|\__,_|_|  \__,_|\___|\__\___|_|  |___/
//                                                   

export const middleDot = '·'
export const thinSpace = ' '
test(() => {
	ok(middleDot === '\u00B7')//U+00B7 on websites about unicode
	ok(thinSpace === '\u2009')//U+2009
	ok(middleDot.length == 1 && Data({text: middleDot}).base16() == 'c2b7')//one character, but two bytes
	ok(thinSpace.length == 1 && Data({text: thinSpace}).base16() == 'e28089')//one character, but three bytes
})

export const Limit = Object.freeze({

	//program types
	tag: tagLength,//tags are exactly 21 characters, like "JhpmKdxqPtxv6zXZWglBL"
	hash: 52,//a sha256 hash value in base32 without padding is exactly 52 characters, like "FTZE3OS7WCRQ4JXIHMVMLOPCTYNRMHS4D6TUEXTTAQZWFE4LTASA"

	//user submission limits
	name: 42,//user names and route slugs, super sized from twitter 15, 20 reddit, 30 gmail, and 32 tumblr
	title: 280,//from 𝕏 née Twitter
	post: 2200,//for posts and comments, from instagram and tiktok

	//html form field limits
	input: 512,//higher ceiling for single line form fields
	area: 10000,//and for text areas, from twitter DMs and reddit posts
})
export function cropToLimit(s, customLimit, defaultLimit) {
	let limit = customLimit || defaultLimit//use the default limit if the caller above specified no custom limit
	if (!limit) toss('use', {s, customLimit, defaultLimit})//you must call crop with a default limit!
	return s.length > limit ? s.slice(0, limit) : s//take just the first part, up to the limit, if s is too long
}
test(async () => {
	function f(s, characters, bytes) {
		ok(s.length == characters)
		ok(Data({text: s}).size() == bytes)
	}
	//we'll enforce the above limits with the easy and common s.length, while realizing percieved characters and actual bytes are not always the same!
	f('A', 1, 1)//simple letter A, one character, one byte
	f('é', 1, 2)//acute e, one character, two bytes
	f('😀', 2, 4)//emoji and instagram fonts can be more!
	f('𝕏', 2, 4)

	ok(Tag().length == Limit.tag)//program types
	ok((await Data({random: 4}).hash()).base32().length == Limit.hash)
})
test(() => {
	let limit; ok(cropToLimit('123456', limit, 5) == '12345')//limit not set, so goes to the required given default
	limit = 3; ok(cropToLimit('123456', limit, 5) == '123')
})

//  _        _             _ _                 
// | |_ _ __(_)_ __ ___   | (_)_ __   ___  ___ 
// | __| '__| | '_ ` _ \  | | | '_ \ / _ \/ __|
// | |_| |  | | | | | | | | | | | | |  __/\__ \
//  \__|_|  |_|_| |_| |_| |_|_|_| |_|\___||___/
//                                             

//split the given text into an array of lines, omitting blank lines, and trimming and coalescing space in each line
export function trimLines(s, limit) {
	let cropped = cropToLimit(s, limit, Limit.area)
	let lines = (cropped
		.replace(/[\r\n\u2028\u2029]+/gu, '\n')//turn each group of any newlines into just \n all Mac classic-style
		.split('\n')//to then split the text into an array of lines
		.map(line => trimLine(line, limit))//trim each line and collapse internal whitespace
		.filter(line => line.length > 0)//and omit blank lines
	)
	return {lines, text: lines.join('\n')}//text for the database, lines for the page
}
test(() => {
	ok(trimLines('A\r\nB').lines.length == 2)
	ok(trimLines('\nA\n\nB\n').lines.length == 2)

	//add some tests to confirm no blank lines, and .text ends \n
	//ttd february2025
})

//trim space from the ends of s, and coalesce multiple whitespace characters
export function trimLine(s, limit) {
	let cropped = cropToLimit(s, limit, Limit.area)
	return (cropped
		.replace(/[\t\n\r\u2028\u2029]/gu, ' ')//first, convert ascii and unicode tabs and newlines into normal spaces
		.trim()//remove whitespace from the ends
		.replace(/(\s)\s+/gu, '$1')//remove all but the first whitespace character in groups of two or more
	)
}
test(() => {
	ok(trimLine('a') == 'a')
	ok(trimLine('') == '')
	ok(trimLine(' ') == '')

	ok(trimLine('\nA\nB\n') == 'A B')
	ok(trimLine('\tIndented  wide\r\n') == 'Indented wide')

	ok(trimLine(`$12${thinSpace+thinSpace}345${middleDot}67`) == `$12${thinSpace}345${middleDot}67`)
	ok(trimLine('  First\u00A0 Last  ') == 'First\u00A0Last')//unicode nonbreaking space
})

//      _                __                              _       
//  ___| |_   _  __ _   / _| ___  _ __   _ __ ___  _   _| |_ ___ 
// / __| | | | |/ _` | | |_ / _ \| '__| | '__/ _ \| | | | __/ _ \
// \__ \ | |_| | (_| | |  _| (_) | |    | | | (_) | |_| | ||  __/
// |___/_|\__,_|\__, | |_|  \___/|_|    |_|  \___/ \__,_|\__\___|
//              |___/                                            

//remove accents from vowels
export function deaccent(s) {
	return (s
		.normalize('NFD')//convert accented characters to their decomposed form
		.replace(/[\u0300-\u036f]/g, '')//remove combining diacritic marks
	)
}
test(() => {
	ok(deaccent('áéíóúÁÉÍÓÚ') == 'aeiouAEIOU')
	ok(deaccent('français') == 'francais')
	ok(deaccent('İstanbul (Not Constantinople)') == 'Istanbul (Not Constantinople)')//tmbg

	ok(deaccent('łódź') == 'łodz')//this method is pretty good and very simple, but really only works for vowels; chat says NFKD might get this one; there's also npm slugify
})

//sanitize text from the user that might be fine on the page for use in the URL, like a user name or post title
export function slug(s, limit) {//will return blank if s doesn't have any safe characters at all!
	s = cropToLimit(s, limit, Limit.name)//crop at the start; mutations below all make s the same length or shorter

	s = deaccent(s)//remove accents from vowels
	s = s.replace(/[-–—]+/g, '-')//simplify dashes
	s = s.replace(/[^A-Za-z0-9\s\-_.~]/gu, ' ')//allow all RFC 3986's unreserved characters, even tilde

	s = s.replace(/\s+/gu, ' ')//coalesce and convert groups of ascii and unicode space, tab, and new line characters into single spaces, note "gu" where we match with \s to be certain to include unicode spaces
	s = s.trim()
	s = s.replace(/ /g, '-')//avoid %20

	s = s.replace(/([-._~]{3,})/g, match => match.slice(0, 2))//allow groups of punctuation, but no longer than 2
	s = s.replace(/\.{2,}/g, '.')//allow periods, but not 2 or more together

	s = s.replace(/^[^A-Za-z_]+|[^A-Za-z0-9_]+$/g, '')//must start Az_ but can end Az09_

	s = s.replace(/[^A-Za-z0-9~.\-_]/g, '')//concluding sanity check to make sure we only let Az09~.-_ through
	return /[A-Za-z]/.test(s) ? s : ''//and only allow s if there's at least one letter, somewhere
}
//export function liveBox(s) { return slug(s) }//live box is great for playing with slug, also
test(() => {
	ok(slug('Strong🐯✊Cat') == 'Strong-Cat')
	ok(slug('東京TOK❤️JFK女の子') == 'TOK-JFK')
	ok(slug('___Hello, World___') == '__Hello-World__')
	ok(slug('_._._.another..day_._._.') == '_.another.day_')
	ok(slug('_._._.another..day._._._') == '_.another.day._')
	ok(slug('007agent007') == 'agent007')
	ok(slug(`The Price is $12${thinSpace+thinSpace}345${middleDot}67, please.`) == 'The-Price-is-12-345-67-please')
	ok(slug('\tt1\tt2\nNet\nWin\r\nOS9\rUni\u2028And null\0') == 't1-t2-Net-Win-OS9-Uni-And-null')//a little System 9 in there, for you
})

//                                               _                   _       
//  _ __   __ _ _ __ ___   ___    __ _ _ __   __| |  _ __ ___  _   _| |_ ___ 
// | '_ \ / _` | '_ ` _ \ / _ \  / _` | '_ \ / _` | | '__/ _ \| | | | __/ _ \
// | | | | (_| | | | | | |  __/ | (_| | | | | (_| | | | | (_) | |_| | ||  __/
// |_| |_|\__,_|_| |_| |_|\___|  \__,_|_| |_|\__,_| |_|  \___/ \__,_|\__\___|
//                                                                           

//ttd february2025
/*
checkName0(name0) makes sure name0 is a valid normalized route that doesn't change when we validate it
checkName2(name2) makes sure name2 is a valid name for the page that doesn't change when we validate it
checkName(all three) makes sure that when we validate each of three they don't change, and also, that formal normalizes to normal!

maybe put those into a single checkName which acts on what it's given--or maybe that's much harder to reason about
*/








//ttd october2025, a big refactor but one you've thought about
/*
						_               __  ___            __ _            __ ____  
__   _____ | | __   __   __/ _|/ _ \   __   __/ _/ |   __   __/ _|___ \ 
\ \ / / _ \| |/ /   \ \ / / |_| | | |  \ \ / / |_| |   \ \ / / |_  __) |
 \ V / (_) |   < _   \ V /|  _| |_| |   \ V /|  _| |_   \ V /|  _|/ __/ 
	\_(_)___/|_|\_( )   \_(_)_|  \___( )   \_(_)_| |_( )   \_(_)_| |_____|
								|/                 |/              |/                   

the validate functions here transform input text from trusted and untrusted sources into a consistant set of forms
they sanitize, clean up, and accept or reject input using defined rules specific to the data type's requirements and conventions

if (v.ok) then alongside will always be three forms: 🧛
v.f0 form zero is the "save" form, normalized to find, sort, and reserve, blocking duplicates
v.f1 form one is the "send" form, canonical to use with external software like the Twilio API or a HTML link
v.f2 form two is the "show" form, visual for pages and cards

for instance, a gmail address:
v.f0 "bobsmith@gmail.com"  gmail ignores periods, so the normalized form removes them to prevent a second signup by bob
v.f1 "Bob.SMITH@gmail.com" for the twilio API, stay close to what bob typed just in case capitalization matters on his email server
v.f2 "Bob.SMITH@gmail.com" lots of times forms are the same, but we always include all three

or a user name:
v.f0 "alice-v3" lowercased to reserve this user name for alice
v.f1 "Alice-v3" here the API is the browser's location bar and web links; a navigation to f0 could redirect to f1
v.f2 "Alice ❤️" spaces and emoji work fine on cards and pages

also returned is v.raw, the same string we were given,
and other properties specific to the data type and validation process, like types, parts, and errors
v.f3, if present, is the "hide" form, f2 redacted to let the user identify without disclosing

because different types have different rules for how the input text resolves to the three forms,
database tables must store all three
triads of columns have titles like address0_text, address1_text, and address2_text

AI found sets of equivalent length names like good/save/send/show/hide, normal/formal/visual, and reserve/working/display
but ok/raw/f0/f1/f2/f3 are shortest, extensible, readily identifiable in code and schema, and learnable
*/























/*
^ttd february2025, so, do you need this? next make the choose/change your user name and route form to figure that out
wait--should checkRoute, for instance, also validate that as given, it doesn't change to normal?!
yes, it should--both check that the given text can be made valid and normal, and that the given text is alerady valid and normal
add that check to the other checkSomething editions
*/
//ttd february2025, you also need to block this list
//ttd february2025, maybe make these passed limits compulsory so below is simpler, and calls here are explicit; you have to say it in the html after all






//a cheat to bundle the validation trio into a v object, when it's from the database, so you don't need to check it
export function bundleValid({f0, f1, f2}) {
	checkText(f0); checkText(f1); checkText(f2)//sanity check, even though you don't know what these are or what's valid for them, bundle, at least, needs them all to be something
	return {ok: true, f0, f1, f2, bundled: true}//ok true means treat it as valid, but also bundled true indicates didn't pass through a validate function
}
//ttd march2025, is this a good idea? you're tried of typing out the three forms everywhere, and v could mean object from validate function
//essentially, you find yourself using this when the three forms come from a database table, and you want to send them into code that also works with a v object from a validate function, so, that sounds reasonable





//ttd march2025, when you let the user choose their forms 1 and 2 names, name1->name0 must be available, and name2 must not collide with name0, either! this so you can make log in by name, and let the type any of the three forms


export function checkName({f2, f1, f0}) {
	let message = _checkName({f2, f1, f0})
	if (message != 'Ok.') toss(message, {f2, f1, f0})
}
function _checkName({f2, f1, f0}) {
	let v2, v1, v0
	if (given(f2)) {//remember that blank strings, while not valid, are falsey!
		v2 = validateName(f2, Limit.name)
		if (!v2.f2ok) return 'page form not valid'//page form can be valid, but not validate into the other two; they can be separate
		if (v2.f2 != f2) return 'page form round trip mismatch'
	}
	if (given(f1)) {
		v1 = validateName(f1, Limit.name)
		if (!v1.ok) return 'formal form not valid'
		if (v1.f1 != f1) return 'formal form round trip mismatch'
	}
	if (given(f0)) {
		v0 = validateName(f0, Limit.name)
		if (!v0.ok) return 'normal form not valid'
		if (v0.f0 != f0) return 'normal form round trip mismatch'
	}
	if (given(f1) && given(f0)) {//after checking all given forms individually, also make sure formal normalizes into normal
		if (v1.f0 != f0) return 'round trip mismatch between normal and formal forms'
	}
	return 'Ok.'
}
test(() => {
	//example use
	ok(_checkName({f2: 'My Name', f1: 'My-Name', f0: 'my-name'}) == 'Ok.')//all valid and happen to match
	ok(_checkName({f2: '2B', f1: 'TwoB', f0: 'twob'}) == 'Ok.')//all valid, with formal is custom from page

	ok(_checkName({f2: ''}) != 'Ok.')//make sure blank is identified as not valid
	ok(_checkName({f1: ''}) != 'Ok.')
	ok(_checkName({f0: ''}) != 'Ok.')

	ok(_checkName({f2: ' '}) == 'page form not valid')//cannot be made valid, not ok
	ok(_checkName({f2: ' Untrimmed'}) == 'page form round trip mismatch')//have to be made valid, also not ok
	ok(_checkName({f1: 'Has Space'})  == 'formal form round trip mismatch')
	ok(_checkName({f0: 'Uppercase'})  == 'normal form round trip mismatch')

	//below, all four forms are valid individually...
	ok(_checkName({f1: 'Name-1', f0: 'name-1'}) == 'Ok.')//...and together
	ok(_checkName({f1: 'Name-1', f0: 'name-2'}) != 'Ok.')//...but not together!
})
const reservedRoutes = ['about', 'account', 'admin', 'administrator', 'app', 'ban', 'billing', 'blog', 'community', 'config', 'contact', 'creator', 'dashboard', 'developer', 'dm', 'e', 'f', 'fan', 'faq', 'feed', 'feedback', 'forum', 'help', 'home', 'i', 'legal', 'login', 'logout', 'manage', 'me', 'messages', 'moderator', 'my', 'notifications', 'official', 'privacy', 'profile', 'q', 'qr', 'register', 'report', 'root', 'search', 'settings', 'shop', 'signin', 'signout', 'signup', 'staff', 'status', 'store', 'subscribe', 'support', 'system', 'terms', 'unsubscribe', 'user', 'verify']//profile pages are on the root route; prevent a user from clashing with a utility or brochure page!
export function validateName(raw, limit) {//raw text from either the first (page) or second (link/route) boxes in the choose or change your user name form
	let cropped = cropToLimit(raw, limit, Limit.name)
	let f2 = trimLine(cropped)//"東京❤️女の子" valid for display on the page
	let f1 = slug(cropped)//"Tokyo-Girl" working and correct route for links
	let f0 = f1.toLowerCase()//"tokyo-girl" reserved to prevent duplicates, also a working route
	let k = hasText(f2) && hasText(f1) && hasText(f0) && !reservedRoutes.includes(f0)
	let f2ok = hasText(f2)
	return {ok: k, f0, f1, f2, f2ok, raw, cropped}
}
test(() => {
	function f(raw, normal, formal, page) {
		let v = validateName(raw)
		ok(v.f0 == normal)
		ok(v.f1 == formal)
		ok(v.f2   == page)
	}
	let v = validateName('2 Rainbows 🌈🌈 4U ')//raw text from user that starts with number, contains emoji, and has an extra space at the end
	ok(v.f2 == '2 Rainbows 🌈🌈 4U')//text to display on the page, trimmed
	ok(v.f1 == 'Rainbows-4U')//chosen route, case preserved
	ok(v.f0 == 'rainbows-4u')//normalized route to confirm unique and then reserve--both of these routes work

	ok(!validateName('Terms').ok)//format is valid, but normal form is reserved
})

//  _   _ _   _                        _                   _   
// | |_(_) |_| | ___    __ _ _ __   __| |  _ __   ___  ___| |_ 
// | __| | __| |/ _ \  / _` | '_ \ / _` | | '_ \ / _ \/ __| __|
// | |_| | |_| |  __/ | (_| | | | | (_| | | |_) | (_) \__ \ |_ 
//  \__|_|\__|_|\___|  \__,_|_| |_|\__,_| | .__/ \___/|___/\__|
//                                        |_|                  

export function validateTitle(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)
	let f0 = trimLine(cropped)
	if (!hasText(f0)) return {f0, raw, cropped}
	return {ok: true, f0, raw, cropped}
}

export function validatePost(raw, limit) {//returns an array of paragraphs
	let cropped = cropToLimit(raw, limit, Limit.post)
	let lines = trimLines(cropped)
	if (!hasText(lines.text)) return {raw, cropped}
	return {ok: true, f0: lines.text, lines, raw, cropped}//normal form is single string with \n at the end of each line, also including lines, the array, which will be useful if this is going to get rendered into <p> tags or something on a web page
}

























//             _   _             
//   __ _  ___| |_(_) ___  _ __  
//  / _` |/ __| __| |/ _ \| '_ \ 
// | (_| | (__| |_| | (_) | | | |
//  \__,_|\___|\__|_|\___/|_| |_|
//                               

export function checkActions({action, actions}) {//this actions check is an optional convenience for api endpoint code, and is not required
	if (actions?.length) {//this api endpoint is coded to use the actions check, so now the page's body.action must be in the allowed list
		checkText(action)//so, optional for the endpoint, but when used, required for the page
		if (!/^[A-Z]/.test(action))    toss('form', {action, actions})
		if (!/\.$/.test(action))       toss('form', {action, actions})
		if (!actions.includes(action)) toss('action not supported', {action, actions})//the action the page posted isn't in the api endpoint code's list of allowed actions
	}
}
test(() => {
	checkActions({action: 'Do.', actions: ['Do.', 'Some.', 'Thing.']})

	let actions = ['Get.', 'Set.', 'Delete.']
	ok(actions.includes('Get.'))
	ok(!actions.includes('Shift.'))
	ok(!actions.includes(''))
	ok(!actions.includes('get.'))
})

//             _ _     _       _       
// __   ____ _| (_) __| | __ _| |_ ___ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \
//  \ V / (_| | | | (_| | (_| | ||  __/
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|
//                                     

/*
notes about validation

modules you found:
zod has 32 million downloads and is standalone
credit-card-type has half a million downloads and installs 1 package
libphonenumber-js has 5 million downloads and installs 1 package

current limitations in phone:
-you're assuming US rather than telling libphonenumber what country to fit to

current limitations in card:
-credit-card-type groups digits, and detects type from what the user has typed so far

data forms:
-raw, what the user put in the box
-adjusted, improved to make validation more likely to work, like trimmed or only digits
-presented, formatted for pretty human consumption, like grouping digits in a card number
-normalized, boiled down all the way to store in the database, and notice a duplicate

guaranteed data pathway:
raw -> f1 -> f2
				 \-> f0

email example:
f0, nee normalized: 'bobfrank@gmail.com',   heaviest changes, store in database to prevent a duplicate
f1, nee adjusted:   'Bob.Frank@GMAIL.COM',  light changes to pass validation; give to APIs
f2, nee presented:  'Bob.Frank@gmail.com',  heavier formatting, show back to the user on the page
raw:                ' Bob.Frank@GMAIL.COM', what the user typed

and so what do you pass to the email or credit card API?
f1, in case the user's weird way of writing it actually matters
the log of exactly what you told the api records f1

keep f1 and f0 in the database
f0 to quickly detect a duplicate
f1 for a later repeat use with an API
and when composing text for the page, do f1 -> f2

uniformly, these validation functions take raw text from the user's keystrokes
and return an object like {ok, f0, f1, f2, raw, otherPartsOrDetails, ...}
*/

//             _ _     _       _                              _ _ 
// __   ____ _| (_) __| | __ _| |_ ___    ___ _ __ ___   __ _(_) |
// \ \ / / _` | | |/ _` |/ _` | __/ _ \  / _ \ '_ ` _ \ / _` | | |
//  \ V / (_| | | | (_| | (_| | ||  __/ |  __/ | | | | | (_| | | |
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|  \___|_| |_| |_|\__,_|_|_|
//                                                                

let _zodEmail//standard pattern to make once on first use for any number of uses; doesn't hold state
function zodEmail() {
	if (!_zodEmail) _zodEmail = zod.string().email()//make a zod schema to only accept strings that look like valid email addresses
	return _zodEmail
}

const periodIgnorers = ['gmail.com', 'googlemail.com', 'proton.me', 'protonmail.com', 'pm.me', 'protonmail.ch']//these providers, gmail and protonmail, deliver mail addressed to first.last@gmail.com to the user firstlast@gmail.com
export function checkEmail(raw, limit) { let v = validateEmail(raw, limit); if (!v.ok) toss('form', {v}); return v }
export function validateEmail(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	/* (1) adjusted step for email
	trim space before and after
	don't touch space in the middle
	*/
	let f1 = cropped.trim()
	let j1 = zodEmail().safeParse(f1)
	if (!j1.success) return {f1, raw, cropped, j1}//ok not true on these early returns

	/* (2) presented step for email
	leave the name the same, but lowercase the domain
	BOBSMITH@SPINDEX.BIZ clearly has his caps lock on, but maybe his email only works if you shout at him
	TomStoppard@SpeedOfArt.net is used to seeing his domain flattened
	*/
	let p = cut(f1, "@")
	let f2 = p.before + "@" + p.after.toLowerCase()
	let j2 = zodEmail().safeParse(f2)
	if (!j2.success) return {f1, f2, raw, cropped, j2}

	/* (3) normalized step for email
	here, we want to prevent MrMorgan@example.com from creating a second account as mrmorgan@example.com
	additionally, we want to notice that mr.morgan@gmail.com is the same guy as mrmorgan@gmail.com; this is gmail-specific
	if we find others like this, we can add them here, but database data won't have gone through the latest validator
	*/
	let name = p.before.toLowerCase()
	let domain = p.after.toLowerCase()
	name = cut(name, '+').before//name+spam@example.com is really name@example.com
	if (periodIgnorers.includes(domain)) name = name.replace(/\./g, '')//first.last@gmail.com is really firstlast@gmail.com
	let f0 = name + "@" + domain
	let j3 = zodEmail().safeParse(f0)
	if (!j3.success) return {f1, f2, f0, raw, cropped, j3}

	return {ok: true, f0, f1, f2, raw, cropped}
}
test(() => {

	//sanity check
	ok(!validateEmail('').ok)
	ok(validateEmail('name@example.com').ok)
	ok(validateEmail(' First.Last@EXAMPLE.COM\r\n').ok)

	//mistakes
	ok(!validateEmail('name#example.com').ok)//spaces
	ok(!validateEmail('first last@example.com').ok)//spaces
	ok(!validateEmail('first.last@example com').ok)
	ok(!validateEmail('first@last@example.com').ok)//two ats

	//dots
	ok(validateEmail('first.last@department.example.com').ok)//correct
	ok(!validateEmail('first.last@example..com').ok)
	ok(!validateEmail('first.last@.example.com').ok)
	ok(!validateEmail('first.last@example.com.').ok)
	ok(!validateEmail('first.last@example').ok)

	//no edge dots in name, either; this one you weren't even sure about
	ok(!validateEmail('.name@example.com').ok)
	ok(!validateEmail('name.@example.com').ok)

	//four forms when valid
	function f(raw, f1, f2, f0) {
		let v = validateEmail(raw)
		ok(v.ok)
		ok(v.f1 == f1)
		ok(v.f2 == f2)
		ok(v.f0 == f0)
	}
	//lowercasing to keep working, make pretty, and detect a duplicate
	f(' Name@Example.com ', 'Name@Example.com', 'Name@example.com', 'name@example.com')
	f(' NAME@EXAMPLE.COM ', 'NAME@EXAMPLE.COM', 'NAME@example.com', 'name@example.com')
	//preventing gmail users from making multiple accounts
	f(' first.last@hotmail.com ', 'first.last@hotmail.com', 'first.last@hotmail.com', 'first.last@hotmail.com')
	f(' first.last@gmail.com ', 'first.last@gmail.com', 'first.last@gmail.com', 'firstlast@gmail.com')
	f('a.b.c@proton.me', 'a.b.c@proton.me', 'a.b.c@proton.me', 'abc@proton.me')
	//outsmarting the +spam trick
	f('bob+spam@yahoo.com', 'bob+spam@yahoo.com', 'bob+spam@yahoo.com', 'bob@yahoo.com')
	f('bob+spam+note@yahoo.com', 'bob+spam+note@yahoo.com', 'bob+spam+note@yahoo.com', 'bob@yahoo.com')
	f('a.b+spam@proton.me', 'a.b+spam@proton.me', 'a.b+spam@proton.me', 'ab@proton.me')
})

//probably won't have these; instead should be part of the theorized validate form as a whole system? ttd march2025
export function validateEmailOrPhone(raw) {
	let vEmail = validateEmail(raw); if (vEmail.ok) { vEmail.type = 'Email.'; return vEmail }
	let vPhone = validatePhone(raw); if (vPhone.ok) { vPhone.type = 'Phone.'; return vPhone }
	return {email: vEmail, phone: vPhone}//not valid as either
}

//             _ _     _       _               _                      
// __   ____ _| (_) __| | __ _| |_ ___   _ __ | |__   ___  _ __   ___ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \ | '_ \| '_ \ / _ \| '_ \ / _ \
//  \ V / (_| | | | (_| | (_| | ||  __/ | |_) | | | | (_) | | | |  __/
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___| | .__/|_| |_|\___/|_| |_|\___|
//                                      |_|                           

export function checkPhone(raw, limit) { let v = validatePhone(raw, limit); if (!v.ok) toss('form', {v}); return v }
export function validatePhone(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	let numerals = takeNumerals(cropped)
	let assumedRegion//leave undefined if not US
	if (numerals.length == 10 ||//assume all 10 digit numbers are US
		(numerals.length == 11 && numerals[0] == '1'))//or they also typed the 1 at the start
		assumedRegion = 'US'

	let phone = parsePhoneNumberFromString(cropped, assumedRegion)
	if (!phone || !phone.isValid()) return {raw, cropped, assumedRegion, phone}

	let f0 = phone.format('E.164')//as established by the International Telecommunication Union
	let f1 = f0//use E.164 with APIs, also
	let f2 = phone.formatInternational()//prettier, with spaces, for the user to see on the page
	if (!hasText(f0) || !hasText(f2)) return {f0, f1, f2, raw, cropped, assumedRegion, phone}

	return {ok: true, f0, f1, f2, raw, cropped, assumedRegion, phone}
}
test(() => {
	ok(!validatePhone('').ok)//blank
	ok(!validatePhone('5551234').ok)//local
	ok(!validatePhone('pizza').ok)//nonsense

	function f(country, f0, raw, f2) {
		let v = validatePhone(raw)
		ok(v.ok)
		ok(v.phone.country == country)
		ok(v.f2 == f2)
		ok(v.f0 == f0)
	}

	//common typing
	f('US', '+14155552671',   '4155552671', '+1 415 555 2671')
	f('US', '+14155552671',  '14155552671', '+1 415 555 2671')
	f('US', '+14155552671', '+14155552671', '+1 415 555 2671')

	//extra characters, still valid
	f('US', '+14155552671',   '415 555 2671',     '+1 415 555 2671')
	f('US', '+14155552671',   '415.555.2671',     '+1 415 555 2671')
	f('US', '+14155552671',   '415-555-2671',     '+1 415 555 2671')
	f('US', '+14155552671', ' \t415 5552671\r\n', '+1 415 555 2671')

	//around the world
	f('US', '+14155552671',   '+14155552671',    '+1 415 555 2671')//United States
	f('GB', '+442071838750',  '+442071838750',  '+44 20 7183 8750')//United Kingdom
	f('CA', '+14165555555',   '+14165555555',    '+1 416 555 5555')//Canada
	f('AU', '+61293744000',   '+61293744000',   '+61 2 9374 4000')//Australia
	f('DE', '+493012345678',  '+493012345678',  '+49 30 12345678')//Germany
	f('FR', '+33123456789',   '+33123456789',   '+33 1 23 45 67 89')//France
	f('JP', '+81312345678',   '+81312345678',   '+81 3 1234 5678')//Japan
	f('IN', '+911234567890',  '+911234567890',  '+91 1234 567 890')//India
	f('CN', '+8613812345678', '+8613812345678', '+86 138 1234 5678')//China
	f('BR', '+5511987654321', '+5511987654321', '+55 11 98765 4321')//Brazil
})

//             _ _     _       _                           _ 
// __   ____ _| (_) __| | __ _| |_ ___    ___ __ _ _ __ __| |
// \ \ / / _` | | |/ _` |/ _` | __/ _ \  / __/ _` | '__/ _` |
//  \ V / (_| | | | (_| | (_| | ||  __/ | (_| (_| | | | (_| |
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|  \___\__,_|_|  \__,_|
//                                                           

export function checkCard(raw, limit) { let v = validateCard(raw, limit); if (!v.ok) toss('form', {v}); return v }
export function validateCard(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	/* (1) adjusted step for credit card number
	just numerals, removing spaces, dots, dashes; this is the normalized form
	*/
	let f0 = takeNumerals(cropped)

	/* (3) intermediate step for a number the user hasn't finished typing yet
	use braintree's credit-card-type module to get the type
	this module also tells you how to group the numerals
	*/
	let cardType = creditCardType(f0)//from npm credit-card-type
	if (!cardType.length) return {f0, raw, cropped, cardType, note: 'no type'}//cardType should be an array of at least one possible type
	let gaps = cardType[0].gaps//go with first identified type, but know that there can be several
	let gap = 0//index in the array of gaps
	let f2 = ''
	for (let i = 0; i < f0.length; i++) {//loop for each numeral
		if (gap < gaps.length && i == gaps[gap]) {//weve reached a gap position
			f2 += ' '//add a gap
			gap++//watch for the next gap
		}
		f2 += f0[i]//bring in this numeral
	}
	if (takeNumerals(f2) != f0) return {f0, f2, raw, cropped, cardType, note: 'round trip mismatch'}

	/* (4) make sure the length is correct and check the last digit with Luhn
	*/
	if (!cardType[0].lengths.includes(f0.length)) return {f0, f2, raw, cropped, cardType, note: 'bad length'}
	if (!isLuhn(f0)) return {f0, f2, raw, cropped, cardType, note: 'bad luhn'}

	return {ok: true, f0, f2, raw, cropped, cardType}//also return the detected type information
}
test(() => {

	//some valid international credit card numbers from chat
	ok(validateCard('4111 1111 1111 1111').ok) // Visa
	ok(validateCard('5555 5555 5555 4444').ok) // MasterCard
	ok(validateCard('3782 822463 10005').ok) // American Express (Amex)
	ok(validateCard('6011 1111 1111 1117').ok) // Discover
	ok(validateCard('3566 1111 1111 1113').ok) // JCB (Popular in Japan)
	ok(validateCard('3056 9309 0259 04').ok) // Diners Club International
	ok(validateCard('6759 6498 2643 8453').ok) // Maestro (Popular in Europe)
	ok(validateCard('4000 0566 5566 5556').ok) // Carte Bancaire (Popular in France)
	ok(validateCard('6304 0000 0000 0000').ok) // Laser (Previously popular in Ireland)
	ok(validateCard('6200 0000 0000 0005').ok) // China UnionPay (Popular in China)
	ok(validateCard('6071 7980 0000 0000').ok) // NPS Pridnestrovie (Popular in Transnistria)

	//more that should be valid, but braintree doesn't like them
	ok(!validateCard('5067 9900 0000 0000 0009').ok) // Elo (Popular in Brazil)
	ok(!validateCard('6062 8288 0000 0000').ok) // Hipercard (Popular in Brazil)
	ok(!validateCard('6071 9811 0000 0000').ok) // RuPay (Popular in India)
	ok(!validateCard('6370 0028 0000 0000').ok) // Interac (Popular in Canada)
	ok(!validateCard('5019 5555 5555 5555').ok) // Dankort (Popular in Denmark)
	ok(!validateCard('5610 0000 0000 0000').ok) // Bankcard (Popular in Australia)
	ok(!validateCard('2200 0000 0000 0000').ok) // Mir (Popular in Russia)
	ok(!validateCard('4779 9990 0000 0000').ok) // Zimswitch (Popular in Zimbabwe)

	//get the type soon as the user is typing, even when it's not valid yet
	function a(partial, type) {
		let v = validateCard(partial)
		ok(!v.ok)//not valid yet
		ok(v.cardType[0].niceType == type)//name of first possible type identified
	}
	a('4111', 'Visa')
	a('55', 'Mastercard')//braintree says not internally capitalized
	a('3782 822', 'American Express')

	//four forms when valid
	function b(raw, f2, f0) {
		let v = validateCard(raw)
		ok(v.ok)
		ok(v.f2 == f2)
		ok(v.f0 == f0)
	}
	b('4111 1111 1111 1111',     '4111 1111 1111 1111', '4111111111111111')
	b('4111111111111111',        '4111 1111 1111 1111', '4111111111111111')
	b('4111-1111-1111-1111',     '4111 1111 1111 1111', '4111111111111111')
	b('4111 1111 1111 1111\r\n', '4111 1111 1111 1111', '4111111111111111')
	b('3782 822463 10005',  '3782 822463 10005', '378282246310005')
	b('3782 8224 6310 005', '3782 822463 10005', '378282246310005')
})

function isLuhn(s) {
	checkNumerals(s)//make sure s is one or more numerals
	const digits = s.split('').reverse().map(d => Number(d))//turn s like "12345" into [5, 4, 3, 2, 1]
	let sum = 0
	for (let i = 0; i < digits.length; i++) {
		let digit = digits[i]
		if (i % 2 === 1) {//for the inner stripe color digits
			digit = digit * 2//double
			if (digit > 9) digit -= 9//if there are two digits like 12 sum them like 3
		}
		sum += digit
	}
	return sum % 10 == 0//if ends with a 0 Hans Peter Luhn says looks good
}
test(() => {
	ok(isLuhn('0'))//single zero passes
	ok(isLuhn('79927398713'))//classic test vector
	ok(isLuhn('4539578763621486'))//valid visa
	ok(isLuhn('5555555555554444'))//mastercard
	ok(isLuhn('378282246310005'))//don't leave home without it

	ok(!isLuhn('79927398714'))//classic vector with bad check digit
	ok(!isLuhn('4539578763621487'))//visa with last digit off
	ok(!isLuhn('1234567812345678'))//random 16-digit fails
})

//      _       _          __              _     _            _   _ _         
//   __| | __ _| |_ ___   / _| ___  _ __  (_) __| | ___ _ __ | |_(_) |_ _   _ 
//  / _` |/ _` | __/ _ \ | |_ / _ \| '__| | |/ _` |/ _ \ '_ \| __| | __| | | |
// | (_| | (_| | ||  __/ |  _| (_) | |    | | (_| |  __/ | | | |_| | |_| |_| |
//  \__,_|\__,_|\__\___| |_|  \___/|_|    |_|\__,_|\___|_| |_|\__|_|\__|\__, |
//                                                                      |___/ 

//date for identity: "19991201" <--> v: {ok: true, ...} zone from browser

export function checkDate(raw) { let v = validateDate(raw); if (!v.ok) toss('form', {v}); return v }
export function validateDate(raw) {
	let adjusted = takeNumerals(raw)
	adjusted = cropToLimit(adjusted, undefined, 8)//"YYYYMMDD" is 8 characters
	if (adjusted.length != 8) return {ok: false, raw}
	let year  = parseInt(adjusted.slice(0, 4), 10)
	let month = parseInt(adjusted.slice(4, 6), 10)
	let day   = parseInt(adjusted.slice(6, 8), 10)
	if (year  < 1869 || year  > 9999 ||//sanity check bounds for a current date of birth
			month <    1 || month >   12 ||
			day   <    1 || day   >   31) return {ok: false, raw, year, month, day}
	return {//return an object with properties to match our validation pattern
		ok: true,
		f0: adjusted,//store in database to record and identify duplicates
		f1: adjusted,//not really used, would be the form we would hand to an API
		f2: `${year}-${Time.months.oneToJan[month]}-${day}`,//form to show to the user on the page
		raw,//exactly the string we were given
		year, month, day,//component information for use by code, these are numbers, not text, for instance
	}
}
test(() => {
	let v = validateDate('20030525')
	ok(v.ok && v.year == 2003 && v.month == 5 && v.day == 25)
})

const zoneMax = (-12)*(-60)//the Howland Islands are UTC-12, times 60 minutes and flip sign to match JavaScript's .getTimezoneOffset
const zoneMin =    14*(-60)//the Republic of Kiribati is UTC+14
export function getPageOffsetMinutes() { return (new Date()).getTimezoneOffset() }//called by page
export function ageDate(rawDate_fromUser, offsetMinutes_fromPage) {//called by server; how old is the given date where the page is?
	return _ageDate(//takes:
		rawDate_fromUser,//(1) untrusted raw date text from the user, like "19980520", can also be from the database and we're revalidating
		offsetMinutes_fromPage,//(2) time zone offset according to the page, in minutes, +/- as from .getTimezoneOffset
		Now()//(3) the time now, in milliseconds, which is trusted when api handler code calls this on the server side
	)//returns the date's age in full years local to the page's time zone
}
function _ageDate(rawDate_fromUser, offsetMinutes_fromPage, now_fromClock) {//separate so tests can simulate now time
	let date_fromUser = checkDate(rawDate_fromUser)//date has .year .month .day numbers; throws if raw wasn't valid

	checkInt(offsetMinutes_fromPage, zoneMin)
	if (//untrusted because from the page, but make sure it's possible for how time zones work on Earth
		offsetMinutes_fromPage < zoneMin ||
		offsetMinutes_fromPage > zoneMax) toss('page offset range', {rawDate_fromUser, date_fromUser, offsetMinutes_fromPage})

	const date_fromPage = new Date(//make a reasonably trusted date from the page
		now_fromClock -//by starting with the trusted server time here where we're running,
		(offsetMinutes_fromPage*Time.minute)//and moving that by the sanity checked time zone offset the page told us
	)
	const year_fromPage  = date_fromPage.getUTCFullYear()
	const month_fromPage = date_fromPage.getUTCMonth()+1//add 1 so January isn't 0
	const day_fromPage   = date_fromPage.getUTCDate()

	let age = year_fromPage - date_fromUser.year//how many candles will be on the 🎂 this year
	if (month_fromPage < date_fromUser.month || (month_fromPage == date_fromUser.month && day_fromPage < date_fromUser.day)) age--//minus one if the big day hasn't arrived yet! 
	return age//🔞
}
test(() => {
	ok(_ageDate('20000101', 0, Date.parse('2020-01-01T00:00:00.000Z')) == 20)//sanity checking with a y2k baby

	//around the world in the winter, here is what pages running (new Date()).getTimezoneOffset() can tell us:
	const offset = {//presented left to right on the map, which is small to big UTC hour offsets, and big to small getTimezoneOffset()s
		bakerIsland:  720,//Baker Island (UTC-12) and the furthest westward possible 🗺️
		california:   480,//California (UTC-8 in winter)
		rockies:      420,//Mountain time (UTC-7 in winter)
		caboVerde:     60,//Cabo Verde (UTC-1)
		london:         0,//London (UTC+0 in winter)
		alps:         -60,//Zurich (UTC+1 in winter)
		tokyo:       -540,//Tokyo (UTC+9)
		lineIslands: -840,//Line Islands (UTC+14) and the furthest eastward possible
	}//but what about summertime? daylight savings shifts don't go outside this range

	//example
	let n = 1710462000000//for the purposes of this test, we're 20 minutes into the Ides of March, 2024, Zulu 🗡️
	ok((new Date(n)).toISOString() == '2024-03-15T00:20:00.000Z')
	let r = '20040315'//and the user has entered that day as his birthday, twenty years earlier
	ok(_ageDate(r, offset.rockies, n) == 19)//it's not his 20th birthday yet back home in the Canadian Rockies ⛰️
	ok(_ageDate(r, offset.alps,    n) == 20)//but it is where he's shredding the Alps 🇨🇭

	//it's the very start of june in 🇬🇧, let's shift a ID date back and forth
	ok(_ageDate('19791231', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 22)
	ok(_ageDate('19800101', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 22)
	ok(_ageDate('19800531', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 22)//born yesterday, May 31st
	ok(_ageDate('19800601', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 22)//born today
	ok(_ageDate('19800602', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 21)//born tomorrow
	ok(_ageDate('19801231', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 21)
	ok(_ageDate('19810101', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 21)

	//next, shift the location west to east
	ok(_ageDate('19800601', offset.bakerIsland, Date.parse('2002-06-01T00:00:00.000Z')) == 21)//westward edge
	ok(_ageDate('19800601', offset.caboVerde,   Date.parse('2002-06-01T00:00:00.000Z')) == 21)//still young in Cabo
	ok(_ageDate('19800601', offset.london,      Date.parse('2002-06-01T00:00:00.000Z')) == 22)//aged up in London
	ok(_ageDate('19800601', offset.alps,        Date.parse('2002-06-01T00:00:00.000Z')) == 22)//and in Zurich
	ok(_ageDate('19800601', offset.lineIslands, Date.parse('2002-06-01T00:00:00.000Z')) == 22)//eastward edge

	//third and last, hang out at the Shepherd Gate Clock for a year
	ok(_ageDate('19800601', 0, Date.parse('2002-01-01T00:00:00.000Z')) == 21)//start of the year
	ok(_ageDate('19800601', 0, Date.parse('2002-05-31T23:59:59.999Z')) == 21)//not quite your birthday yet
	ok(_ageDate('19800601', 0, Date.parse('2002-06-01T00:00:00.000Z')) == 22)//now the party's started 🎉
	ok(_ageDate('19800601', 0, Date.parse('2002-06-01T00:00:00.001Z')) == 22)//going hard
	ok(_ageDate('19800601', 0, Date.parse('2002-12-31T23:59:59.999Z')) == 22)//end of the year
})

//             _ _     _       _                       _ _      _   
// __   ____ _| (_) __| | __ _| |_ ___  __      ____ _| | | ___| |_ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \ \ \ /\ / / _` | | |/ _ \ __|
//  \ V / (_| | | | (_| | (_| | ||  __/  \ V  V / (_| | | |  __/ |_ 
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|   \_/\_/ \__,_|_|_|\___|\__|
//                                                                  

export function checkWallet(raw) { let v = validateWallet(raw); if (!v.ok) toss('form', {v}); return v }
export function validateWallet(raw) {//validate ethereum wallet address
	let t = raw.trim()//t for trimmed

	let r40//r for raw; we'll clip out the 40 base16 numerals from the raw text we were given
	if      (t.length == 42 && t.slice(0, 2).toLowerCase() == '0x') r40 = t.slice(2, 42)//allow "0X" start
	else if (t.length == 40)                                        r40 = t
	else return {ok: false, raw}

	if (!/^[0-9a-fA-F]+$/.test(r40)) return {ok: false, raw}//any value 40 0s through 40 fs is a valid Ethereum address

	let c//c for checksum corrected
	try {
		c = viem_getAddress(('0x'+r40).toLowerCase())
	} catch (e) { return {ok: false, raw} }//checks above should make throwing not possible, but just in case
	let c40 = c.slice(2, 42)//clip out the checksum case-corrected base16 characters

	//at this point the address is valid
	let v = {ok: true, f0: c, f1: c, f2: c, raw}//all the forms are the same
	if (r40 == r40.toUpperCase() || r40 == r40.toLowerCase()) { v.rawCaseUniform = true } else { v.rawCaseMixed = true }
	if (r40 == c40) { v.checksumConfirmed = true } else { v.checksumCorrected = true }
	if (v.rawCaseMixed && v.checksumCorrected) v.checksumWarning = true//important warning if the given address contains a checksum that's wrong!
	return v
}
test(() => {
	ok(validateWallet('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045').ok)//vitalik.eth, Milady
	ok(validateWallet('0xd8da6bf26964af9d7eed9e03e53415d37aa96045').ok)//lowercased ok, this is common
	ok(validateWallet('0XD8DA6BF26964AF9D7EED9E03E53415D37AA96045').ok)//uppercased even including "0X" ok
	ok(validateWallet(  'd8da6bf26964af9d7eed9e03e53415d37aa96045').ok)//no prefix also ok

	ok(validateWallet('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\r\n').ok)//edge space is fine
	ok(validateWallet('  0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  ').ok)
	ok(!validateWallet('0x d8dA6BF26964aF9D7eEd9e03E53415D37aA96045').ok)//interior space is not

	ok(!validateWallet('').ok)//blank
	ok(!validateWallet('bad').ok)//random wrong other string

	ok(  validateWallet('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef').ok)//good
	ok(  !validateWallet('xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef').ok)//not enough prefix
	ok(!validateWallet('00xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef').ok)//too much prefix

	ok(!validateWallet('0xdeadbeefHeadbeefdeadbeefdeadbeefdeadbeef').ok)//bad base16 digit
	ok(!validateWallet('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbe').ok)//too short
	ok(!validateWallet('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefef').ok)//too long

	let v1 = validateWallet('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')//checksum correct
	let v2 = validateWallet('0xd8da6BF26964aF9D7eEd9e03E53415D37aA96045')//checksum mistake!
	let v3 = validateWallet('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')//lowercased input
	let v4 = validateWallet('0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045')//uppercased input

	ok(v1.ok && v2.ok && v3.ok && v4.ok)//all are valid
	ok(v2.checksumWarning)//important checksum warning
	ok(!v1.checksumWarning && !v3.checksumWarning && !v4.checksumWarning)//others don't need that warning
})
/*
here's the code to make seed phrases and get their private key number, code, and wallet address
uncommenting this grows nitro 4.95->5.26mb, and client brotli 336->387kb

in monorepo root $ find . -name english.js
./node_modules/@scure/bip39/esm/wordlists/english.js
found this path looking at client.html from site $ yarn size

in site workspace $ grep -rl "blouse" .
./.output/server/wasm/index_bg-dd4dd8881e2df4e6.wasm
./.output/server/chunks/nitro/nitro.mjs
./.output/public/_nuxt/NTRf4ox-.js
./.output/public/_nuxt/entry.js
chose a bip39 word that isn't likely written into code or comments, even across hundreds of npm modules
but it's hard to open or search within these files to see the list; they're more than just minified

in summary, if you need to deal with seed phrases, it's right here in viem
but it's correct to leave this commented because it does make the client bundle 1.15x
*/
/*
import {generateMnemonic, mnemonicToAccount, english} from 'viem/accounts'//import right on the margin to help tree shaking
test(() => {
	let phrase = generateMnemonic(english)
	ok(phrase.split(' ').length == 12)

	let account = mnemonicToAccount(phrase)
	let private16 = '0x'+account.getHdKey().privKey.toString(16).padStart(64, '0')//64 characters × 4 bits in a base16 character = 256 bit private key

	ok(private16.startsWith('0x') && private16.length == 66)
	ok(account.address.startsWith('0x') && account.address.length == 42)
})
*/














//                                            _ 
//  _ __   __ _ ___ _____      _____  _ __ __| |
// | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
// | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
// |_|                                          

export function measurePasswordStrength(s) {
	let o = {}
	o.length = s.length
	o.hasUpper = /[A-Z]/.test(s)
	o.hasLower = /[a-z]/.test(s)
	o.hasDigit = /\d/.test(s)
	o.hasOther = /[^a-zA-Z\d]/.test(s)

	o.alphabet = 0//how many different characters could be in this password based on the variety of characters we've seen
	if (o.hasUpper) o.alphabet += 26//if it has one uppercase letter, imagine there could be any uppercase letter
	if (o.hasLower) o.alphabet += 26
	if (o.hasDigit) o.alphabet += 10
	if (o.hasOther) o.alphabet += 32//while we allow any characters in passwords, OWASP lists 32 special characters, and most users will probably choose passwords with special characters from that list
	o.permutations = exponent(o.alphabet, o.length)//how many possible passwords exist of this length and variety
	o.permutationsPlaces = (o.permutations+'').length//essentially log10(permutations) that can't overflow
	o.guessYears = fraction([o.permutations, 10], [Time.year, 2]).quotient//how many years it might take to crack this password, assuming a fast computer that can hash a guess in 10 milliseconds, and a successful guess after trying one half (2) of permutations

	if      (o.guessYears <    1) o.sayStrength = 'Weak'
	else if (o.guessYears <   10) o.sayStrength = 'Okay'
	else if (o.guessYears < 1000) o.sayStrength = 'Strong'
	else                          o.sayStrength = 'Very strong'

	o.acceptable = !(o.guessYears < 1)//allow passwords above weak
	o.sayEndurance = sayHugeInteger(o.guessYears)

	if      (o.length < 6)                             o.sayImprovement = 'Make longer'
	else if (o.hasUpper != o.hasLower)                 o.sayImprovement = 'Mix upper and lower case'
	else if (o.hasDigit != (o.hasUpper || o.hasLower)) o.sayImprovement = 'Use letters and numbers'
	else if (!o.hasOther)                              o.sayImprovement = 'Add a special character'
	else                                               o.sayImprovement = 'Make longer'

	if (o.sayStrength == 'Weak') {
		o.sayStatus = `Strength: ${o.sayStrength}. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Okay') {
		o.sayStatus = `Strength: ${o.sayStrength}. ${o.sayEndurance} to guess. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Strong') {
		o.sayStatus = `${o.sayStrength}. ${o.sayEndurance} to guess. ${o.sayImprovement} for more strength.`
	} else if (o.sayStrength == 'Very strong') {
		o.sayStatus = `${o.sayStrength}. ${o.sayEndurance} to guess.`
	}
	return o
}












//      _            _          
//   __| | _____   _(_) ___ ___ 
//  / _` |/ _ \ \ / / |/ __/ _ \
// | (_| |  __/\ V /| | (_|  __/
//  \__,_|\___| \_/ |_|\___\___|
//                              

//true if our best guess is we're running in a browser on a mobile device (smartphone or tablet) with a mobile app store (the iOS App Store or Google Play), where the user has installed or can install an authenticator app (like Google or Microsoft Authenticator, Authy by Twilio, Duo Mobile by Cisco, or others), false on desktop, laptop, Chromebook, or server
export function browserIsBesideAppStore() {
	return isMobile({//use npm is-mobile, 667k weekly downloads, safe to run anywhere (returns false on server)
		tablet: true,//sort tablets as mobile (they have app stores)
		featureDetect: true,//count touch points to correctly classify an iPad in desktop mode as a tablet, mobile, beside app store, true
	})
}

//returns an object like {renderer: "ANGLE (Intel, Intel(R) UHD Graphics 630 ... Direct3D11 vs_5_0 ps_5_0, D3D11)", vendor:"Google Inc. (Intel)"}
export function getBrowserGraphics() {
	let p = {}
	if (defined(typeof document)) {
		let e = document.createElement('canvas')//make a HTML5 <canvas> tag element; doesn't append it to the DOM
		let c = e.getContext('webgl') || e.getContext('experimental-webgl')
		if (c) {
			let x = c.getExtension('WEBGL_debug_renderer_info')
			if (x) {
				p.renderer = c.getParameter(x.UNMASKED_RENDERER_WEBGL)
				p.vendor   = c.getParameter(x.UNMASKED_VENDOR_WEBGL)
			}
		}
	}
	return p
}

test(() => {
	browserIsBesideAppStore()
	getBrowserGraphics()
	//the answers only make sense when called in a browser tab, but make sure they're safe to call everywhere, like lambda, nuxt server render in cloudflare web worker, and so on
})
























//   __                                                      _                     
//  / _|_   _ ________   ___ ___  _ __ ___  _ __   __ _ _ __(_)___  ___  _ __  ___ 
// | |_| | | |_  /_  /  / __/ _ \| '_ ` _ \| '_ \ / _` | '__| / __|/ _ \| '_ \/ __|
// |  _| |_| |/ / / /  | (_| (_) | | | | | | |_) | (_| | |  | \__ \ (_) | | | \__ \
// |_|  \__,_/___/___|  \___\___/|_| |_| |_| .__/ \__,_|_|  |_|___/\___/|_| |_|___/
//                                         |_|                                     

/*
to run these fuzz comparisons:
- run tests in Node with $ yarn test, the modules are installed as development dependencies in the project root
- switch individual tests on with noop <--> test
*/
async function fuzzImports() {
	const {customAlphabet} = await import(/* @vite-ignore */ 'nanoid')
	const {Secret, TOTP}   = await import(/* @vite-ignore */ 'otpauth')//magic comment to calm the aggressive preprocessor 🤯
	return {customAlphabet, Secret, TOTP}
}

/*
Goo-idz!
https://www.npmjs.com/package/nanoid
https://github.com/ai/nanoid
https://zelark.github.io/nano-id-cc/ collision calculator
*/
noop(async () => { const fuzz = await fuzzImports()
	//here's what your Tag() function looked like before you extracted the implementation from nanoid to move it down to level0
	function nanoidTag() {
		const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
		return fuzz.customAlphabet(alphabet, Limit.tag)()//tag length 21, long enough to be unique, short enough to be reasonable, and nanoid's default length
	}
	for (let i = 0; i < 20; i++) log(`${nanoidTag()} from nanoid and ${Tag()} from Tag()`)//sanity check that they look the same
})

/*
RFC4648: base32 character encoding

to store sha256 hash values in the database in a column typed CHAR(52)
you want something (a) brief, (b) double-clickable, and (c) length determined by byte size not value
AI4APBJZISGTL4DOOJRKYPSACN4YSR55NVOJDZCKGXFKEX4AEJHQ, for example

base16 has (b) and (c) but not (a)
base64 has (a) and (c) but not (b)
base62 has (a) and (b) but not (c), and is also our invention rather than an established standard
base32 has (b) and (c) like base16 while being much shorter

Data() has short zero dependency implementations of base16, 32, 62, and 64
turn on this fuzz tester to use the base32 implementation that comes with otpauth to confirm our base32 implementation matches
*/
async function cycle4648(size) { const fuzz = await fuzzImports()
	let d0 = Data({random: size})
	let s1 = d0.base32()//we've written our own implementation of base32 encoding into Data
	let s2 = fuzz.Secret.fromHex(d0.base16()).base32//confirm it matches the behavior in the popular otpauth module
	ok(s1 == s2)
	let d1 = Data({base32: s1})
	let d2 = Data({array: fuzz.Secret.fromBase32(s2).bytes})
	ok(d1.base16() == d2.base16())
}
noop(async () => {
	async function f1() { let size = 32;                     await cycle4648(size) }//a sha256 hash value is 32 bytes (256 bits) 52 base32 characters
	async function f2() { let size = 20;                     await cycle4648(size) }//a standard TOTP secret is 20 bytes (160 bits) 32 base32 characters
	async function f3() { let size = randomBetween(1, 8);    await cycle4648(size) }//short
	async function f4() { let size = randomBetween(1, 1024); await cycle4648(size) }//longer

	let cycles1 = await testCycle(1*Time.second, f1)
	let cycles2 = await testCycle(1*Time.second, f2)
	let cycles3 = await testCycle(1*Time.second, f3)
	let cycles4 = await testCycle(1*Time.second, f4)
	log(look({cycles1, cycles2, cycles3, cycles4}))
})
async function testCycle(m, f) {
	let n = Now()
	let cycles = 0
	while (Now() < n + m) { cycles++; await f() }
	return cycles
}

/*
RFC6238: time-based one-time password
*/
async function cycle6238() { const fuzz = await fuzzImports()
	let d = Data({random: 20})//random shared secret for a totp enrollment
	let t = randomBetween(0, 100*Time.year)//random timestamp between 1970 and 2070

	let code1 = await totpGenerate(d, t)//our custom implementation in level0 which uses the js subtle api, which calls to native code
	let code2 = (new fuzz.TOTP({secret: fuzz.Secret.fromBase32(d.base32()), algorithm: 'SHA1', digits: 6, period: 30})).generate({timestamp: t})//same thing, using the npm otpauth module, 638k weekly downloads, but brings its own javascript implementation of crypto primitives, :(
	ok(code1 == code2)//make sure that our implementation matches what the popular module would compute!
}
noop(async () => {
	let cycles = await testCycle(4*Time.second, cycle6238)
	log(cycles)
})


























//  _               _                                               
// | |__   __ _ ___| |__    _ __ ___   ___  __ _ ___ _   _ _ __ ___ 
// | '_ \ / _` / __| '_ \  | '_ ` _ \ / _ \/ _` / __| | | | '__/ _ \
// | | | | (_| \__ \ | | | | | | | | |  __/ (_| \__ \ |_| | | |  __/
// |_| |_|\__,_|___/_| |_| |_| |_| |_|\___|\__,_|___/\__,_|_|  \___|
//                                                                  

function hashMeasure({file, unit}) {//given a file size, compute measurements about tips and pieces 📏
	if (!(file >= 1 && unit >= 1)) toss('bounds')//both the file size and piece size must be 1 or more bytes
	let o = {file, unit}

	o.pieces = Math.ceil(file / unit)//total number of pieces
	o.complete = Math.floor(file / unit)//quantity of complete pieces
	o.fragment = file % unit//byte size of last piece if it is a fragment

	o.stripes = []
	if (file > 4 * unit) {

		//place indicies
		o.first = 0
		o.middle = Math.floor(file / (2 * unit)) * unit//byte index of middle piece
		o.penultimate = (o.pieces - 2) * unit//second to last piece, must always be complete
		o.last = (o.pieces - 1) * unit//last piece, can be complete, likely a fragment

		//calculate sizes
		o.lastSize = o.fragment || unit//how big the last stripe is
		o.stripeSize = (3 * unit) + o.lastSize//how many bytes we'll hash through all four stripes

		//build stripes; they are all [start, end] both measured from the start of the file, not start and length
		o.stripes.push([o.first, o.first + unit])//first and middle never touch
		if (o.middle + unit == o.penultimate) {//but middle and penultimate can
			o.stripes.push([o.middle, o.middle + unit + unit + o.lastSize])//and penultimate and last always do
		} else {
			o.stripes.push([o.middle, o.middle + unit])//middle with space before and after
			o.stripes.push([o.penultimate, o.penultimate + unit + o.lastSize])
		}

	} else {
		o.all = true//file size is 4 units or less, so just hash the whole thing
		o.stripeSize = file
		o.stripes.push([0, file])
	}
	return o
}
test(() => {
	function f(file, expected) {
		let o = hashMeasure({unit: 4, file})
		let s = `${o.file} ${o.pieces}|${o.complete}|${o.fragment} ` + (o.all ? `all` : `${o.first}|${o.middle}|${o.penultimate}|${o.last}`)
		ok(s == expected.replace(/\s+/g, ' ').replace(/\| /g, '|'))//condense formatting space in given expected strings
	}
	//file size is just before, ... exactly at, or ................ one byte beyond the unit lines
	f(15, '15  4| 3|3 all');        f(16, '16  4| 4|0 all');        f(17, '17  5| 4|1 0| 8|12|16')
	f(19, '19  5| 4|3 0| 8|12|16'); f(20, '20  5| 5|0 0| 8|12|16'); f(21, '21  6| 5|1 0| 8|16|20')
	f(23, '23  6| 5|3 0| 8|16|20'); f(24, '24  6| 6|0 0|12|16|20'); f(25, '25  7| 6|1 0|12|20|24')
	f(27, '27  7| 6|3 0|12|20|24'); f(28, '28  7| 7|0 0|12|20|24'); f(29, '29  8| 7|1 0|12|24|28')
	f(31, '31  8| 7|3 0|12|24|28'); f(32, '32  8| 8|0 0|16|24|28'); f(33, '33  9| 8|1 0|16|28|32')
	f(35, '35  9| 8|3 0|16|28|32'); f(36, '36  9| 9|0 0|16|28|32'); f(37, '37 10| 9|1 0|16|32|36')
	f(39, '39 10| 9|3 0|16|32|36'); f(40, '40 10|10|0 0|20|32|36'); f(41, '41 11|10|1 0|20|36|40')
	f(43, '43 11|10|3 0|20|36|40'); f(44, '44 11|11|0 0|20|36|40'); f(45, '45 12|11|1 0|20|40|44')
})
test(() => {
	function v(file, unit) {//hash stripe visualizer
		let o = hashMeasure({unit, file})
		if (o.all) {
			return 'A'.repeat(file)
		} else {
			let s = ''
			for (let i = 0; i < file; i++) {
				if      (i >= o.first       && i < o.first       + unit      ) s += 'F'
				else if (i >= o.middle      && i < o.middle      + unit      ) s += 'M'
				else if (i >= o.penultimate && i < o.penultimate + unit      ) s += 'P'
				else if (i >= o.last        && i < o.last        + o.lastSize) s += 'L'
				else s += '.'//represents a byte not hashed
			}
			return s
		}
	}
	function f(file, expected) {
		let s = v(file, 2)
		ok(s == expected)
	}
	f( 1, 'A')
	f( 2, 'AA')
	f( 7, 'AAAAAAA')
	f( 8, 'AAAAAAAA')
	f( 9, 'FF..MMPPL')
	f(10, 'FF..MMPPLL')
	f(11, 'FF..MM..PPL')
	f(12, 'FF....MMPPLL')//intentionally, the middle stripe stays forward to get away from a potentially large media header
	f(13, 'FF....MM..PPL')
	f(14, 'FF....MM..PPLL')
	f(15, 'FF....MM....PPL')
})

//given a foreground stripe [a, b] and a background pattern of stripes [[c, d], ...], determine and calculate the overlapping ranges
//the background stripes must not touch or overlap, and indicies are from the start, this is [start, end] not start and length
function hashStripeOverlap(foreground, background) {
	let overlaps = []
	let [a, b] = foreground
	for (let [c, d] of background) {
		if (a < d && b > c) {//there's an overlap!
			overlaps.push([Math.max(a, c), Math.min(b, d)])
		}
	}
	return overlaps.length ? overlaps : null//if there's one overlap, still returns it in an array like [[start, end]]
}
test(() => {
	function f(foreground, background, expected) {
		let f = textToStripes(foreground)[0]
		let b = textToStripes(background)
		let o = stripesToText(hashStripeOverlap(f, b))
		ok(o == expected)
	}
	f(
		'X',//foreground, a single stripe
		'X',//background, one or many stripes
		'X',//resulting overlap, like a bitwise AND but these are bytes in huge ranges
	)

	//misses
	f('X', '.X', '')//single touching
	f('.X', 'X', '')
	f('XX', '..XX', '')//double touching
	f('..XX', 'XX', '')
	f('XX', '...XX', '')//gap between
	f('...XX', 'XX', '')

	//hits
	f('X',
		'XX',
		'X')
	f('.X',
		'XX',
		'.X')
	f('XX',
		'X',
		'X')
	f('XX',
		'.X',
		'.X')

	//simple overlaps
	f('XX',
		'.XX',
		'.X')
	f('.XX',
		'XX',
		'.X')
	f('XX',
		'.XX',
		'.X')
	f('.XXX',
		'XXX',
		'.XX')
	f('XXX',
		'.XXX',
		'.XX')
	f('XXX',
		'.XXX',
		'.XX')

	//more complex
	f('.XXXXXX',
		'X.XX.XXX',
		'..XX.XX')
	f('..XXX',
		'..XXX',
		'..XXX')
	f('...XXXX',
		'..XX..XX',
		'...X..X')
	f('X',   'XX', 'X')
	f('.X',  'XX', '.X')
	f('..X', 'XX', '')
})
function textToStripes(s) {
	let a = []
	let d = null
	for (let i = 0; i < s.length; i++) {
		if (s[i] == 'X') {
			if (d === null) d = i//beginning of a new stripe
		} else {
			if (d !== null) {//end of a stripe
				a.push([d, i])
				d = null
			}
		}
	}
	if (d !== null) a.push([d, s.length])//handle stripe at the end
	return a
}
function stripesToText(a) {
	if (!a || !a.length) return ''
	let e = a[a.length - 1][1]//stripes are in order; use last stripe's end
	let s = Array(e).fill('.')
	for (let [start, end] of a) {
		for (let i = start; i < end; i++) { s[i] = 'X' }
	}
	return s.join('')
}
test(() => {
	function round(s) {//round trip check
		let a = textToStripes(s)
		let t = stripesToText(a)
		ok(s == t)
	}
	round('')
	round('X')
	round('.X')
	round('XX...XXXX')
	round('.XX...XXXX')
})

export function liveBox(s) {
}

//  _               _        __ _ _                        _       _                            
// | |__   __ _ ___| |__    / _(_) | ___    __ _ _ __   __| |  ___| |_ _ __ ___  __ _ _ __ ___  
// | '_ \ / _` / __| '_ \  | |_| | |/ _ \  / _` | '_ \ / _` | / __| __| '__/ _ \/ _` | '_ ` _ \ 
// | | | | (_| \__ \ | | | |  _| | |  __/ | (_| | | | | (_| | \__ \ |_| | |  __/ (_| | | | | | |
// |_| |_|\__,_|___/_| |_| |_| |_|_|\___|  \__,_|_| |_|\__,_| |___/\__|_|  \___|\__,_|_| |_| |_|
//                                                                                              

//a new simple protocol that can hash huge files on both the server and the page; introducing the "Fuji" system 🗻
const hashProtocolPieces = {title: 'Fuji.Pieces.SHA256.4MiB.', size: 4*Size.mb}; Object.freeze(hashProtocolPieces)
const hashProtocolTips   = {title: 'Fuji.Tips.SHA256.4KiB.',   size: 4*Size.kb}; Object.freeze(hashProtocolTips)
const hash_value_size = 32//a SHA-256 hash value is 32 bytes
test(() => { ok(hashProtocolPieces.size == 4_194_304); ok(hashProtocolTips.size == 4096) })
/*
4 MiB hashes in ~10ms similar to the frequency of page animation frames,
uploads in under a second over a typical cable modem, and
keeps the index of hash values smaller than the piece size for files under 500 GB 🗄️
4 KiB matches the cluster and sector size on Windows NTFS and the block size on Mac APFS,
so hard drive reads can be as fast as possible 💽
*/

export async function hashFile({file, size, protocolTips}) {//works in local node testing and browser page with uppy, but not in lambda node!
	if(!(file && size > 0 && file.size == size)) toss('bounds', {file, size})//file is a JavaScript File object, which extends Blob

	//based on the file size, pick stripes at the start, middle, and end for us to hash quickly
	let measureTips = hashMeasure({file: size, unit: protocolTips.size})
	let status = {
		startTime: Now(),
		updateTime: Now(),//when we last changed anything here
		measureTips: measureTips,//include this, too
		totalSize: size,
		hashedSize: 0,//haven't hashed anything yet; we don't have a progress callback that might look, but still
	}

	//for tip hashing, the summary we'll hash is the title followed by stripes of file data (hashing file data, not hashes)
	let tipsTitle = Data({text: `${protocolTips.title}${size}.`})//different sized files hash differently even with identical tips
	let tipsBin = Bin(tipsTitle.size() + measureTips.stripeSize)
	tipsBin.add(tipsTitle)
	for (let [start, end] of measureTips.stripes) {
		checkSizeStartEnd(size, start, end)
		tipsBin.add(Data({buffer: await file.slice(start, end).arrayBuffer()}))
	}

	//hash the summary of the file in the bin
	status.tipHash = await tipsBin.hash()
	status.hashedSize = measureTips.stripeSize//we actually hashed more because of the title, but don't count this as to speed
	status.updateTime = Now()
	status.duration = status.updateTime - status.startTime
	return status
}

export async function hashStream({stream, size, protocolPieces, protocolTips, onProgress, signal}) {//works everywhere, local and lambda node, and uppy page
	signal?.throwIfAborted()
	if (!(stream && size > 0)) toss('bounds', {stream, size})

	let measurePieces = hashMeasure({file: size, unit: protocolPieces.size})//measurements for the piece hash
	let measureTips = hashMeasure({file: size, unit: protocolTips.size})//and for the tip hash, which we'll peek for through the stream
	let status = {//object we'll give to the progress callback, and also return
		startTime: Now(),
		updateTime: Now(),//when we last changed anything here
		measurePieces: measurePieces,
		measureTips: measureTips,
		hashedSize: 0,
		totalSize: size,
	}

	//for the pieces hash, the summary we'll hash is the title followed by hashes of pieces of file data (hashing hashes, not file data)
	let piecesTitle = Data({text: `${protocolPieces.title}${size}.`})
	let piecesBin = Bin(piecesTitle.size() + (hash_value_size * measurePieces.pieces))//space for title followed by hashes of every piece
	piecesBin.add(piecesTitle)

	//for for the tips hash, the summary we'll hash is the title followed by stripes of file data (hashing file data, not hashes)
	let tipsTitle = Data({text: `${protocolTips.title}${size}.`})
	let tipsBin = Bin(tipsTitle.size() + measureTips.stripeSize)//space for title followed by the start, middle, and end stripes of data
	tipsBin.add(tipsTitle)

	//our conveyor belt for hashing bytes then sliding them forward 🏗️
	let belt = {}
	belt.capacity = Math.min(
		2 * protocolPieces.size,//double-wide to hold one full piece and up to all of the next one
		size)//or sized to fit all of a smaller file
	belt.array = new Uint8Array(belt.capacity)//this method allocates a buffer once and uses it for the whole file!
	belt.fill = 0//the belt has .fill bytes of data in it, measured from the start; data bytes are 0 up to belt.fill

	const reader = stream.getReader()
	let address = 0//how far into the stream each box that arrives is
	try {
		while (true) {//loop while boxes of data arrive from the stream
			signal?.throwIfAborted()
			let r = await reader.read()//wait for the stream to give us something

			//a new delivery of bytes from the stream has arrived! 📦
			let box = {}
			if (r.value?.length) {//testing in local node, boxes come in 64kib at a time, the belt holds 128 of that size
				box.data = Data({array: r.value})
				box.shoveled = 0//we move this index over the bytes in the box as we process them; remaining data starts at box.shoveled
				box.stripe = [address, address + box.data.size()]//where in the stream this box of data is

				address += box.data.size()//outside the box, move address past this box to use to mark the start of the next one
			}

			if (box.data) {//the stream gave us a box with data inside

				//first, for the tip hash, we don't have random access through the file, but we do through this box!
				let overlaps = hashStripeOverlap(box.stripe, measureTips.stripes)
				if (overlaps) {//find overlaps, the 1-3 stripes in the stream we should add to assemble the file data for the tip hash
					for (let [start, end] of overlaps) {
						tipsBin.add(box.data.clipView(start - box.stripe[0], end - box.stripe[0]))//subtract box address to clip in data
					}
				}

				//second, for the piece hash, shovel bytes from the box into the belt until the box is empty
				while (box.shoveled < box.data.size()) {//loop to get through them

					//copy a shovelful of bytes from the box to our belt 🪏
					let shovel = Math.min(//how many can we shovel over right now?
						box.data.size() - box.shoveled,//not more that remain for us to take from this delivery
						belt.capacity - belt.fill)//nor more than we have space left in our conveyor belt buffer
					belt.array.set(//into belt...
						box.data.clipView(box.shoveled, box.shoveled + shovel).array(),//...copy shovel quantity bytes from box at index...
						belt.fill)//...to belt at its fill position
					belt.fill += shovel//there are more bytes of stream data in belt now
					box.shoveled += shovel//and we've moved past them in the box

					//if the belt has enough data at the start to hash
					while (belt.fill >= protocolPieces.size) {//hash the first half; if the stream filled 8mb all at once this loop will run twice!
						signal?.throwIfAborted()
						piecesBin.add(await Data({array: belt.array}).clipView(0, protocolPieces.size).hash())//4mib hashes in ~10ms, frequency like animation frames
						status.hashedSize += protocolPieces.size
						status.updateTime = Now()
						onProgress?.(status)

						//slide the second half of the conveyor belt buffer to the start
						let beyond = belt.fill - protocolPieces.size//how many bytes of data are on the belt beyond the first half we just hashed
						if (beyond > 0) belt.array.copyWithin(0, protocolPieces.size, belt.fill)//this calls down to C's memmove, and is very fast
						belt.fill = beyond
					}
				}
			}
			if (r.done) break
		}

		//most files will end with a fragment piece smaller than a full piece
		if (belt.fill > 0) {
			signal?.throwIfAborted()
			piecesBin.add(await Data({array: belt.array}).clipView(0, belt.fill).hash())
			status.hashedSize += belt.fill
			status.updateTime = Now()
			onProgress?.(status)
		}
		if (status.hashedSize != status.totalSize) toss('bounds', {status, note: 'stream length different from file size'})

		//hash the summary of the file in the bin
		signal?.throwIfAborted()
		status.pieceHash = await piecesBin.hash()
		status.tipHash = await tipsBin.hash()
		status.updateTime = Now()
		status.duration = status.updateTime - status.startTime
		onProgress?.(status)
		return status

	} finally {//try with no catch so an exception in here throws upwards into caller
		reader.releaseLock()//but before we leave, success or exception, we always release the file lock
	}
}

//  _               _       _            _   
// | |__   __ _ ___| |__   | |_ ___  ___| |_ 
// | '_ \ / _` / __| '_ \  | __/ _ \/ __| __|
// | | | | (_| \__ \ | | | | ||  __/\__ \ |_ 
// |_| |_|\__,_|___/_| |_|  \__\___||___/\__|
//                                           

//simulate file and stream objects like real ones that come from the local disk, s3, or uppy
function testFile(data) {
	let file = new Blob([data.array()], {type: 'application/octet-stream'})
	file.name = 'simulated.bin'
	file.lastModified = Now()
	let stream = new ReadableStream({
		start(controller) {
			let i = 0
			while (i < data.size()) {
				let b = randomBetween(16*Size.kb, 256*Size.kb)//most boxes from the stream will be 64kib, but here we simulate a full variety
				let j = Math.min(i + b, data.size())
				controller.enqueue(data.clipView(i, j).array())
				i = j
			}
			controller.close()
		}
	})
	return {data, file, stream}
}
//given a mulberry seed, file size, and hashing protocol instructions, hash the file and stream, comparing and returning the results
async function testHashFile({seed, size, protocolPieces, protocolTips}) {
	let data = mulberryData({seed, size})
	let f = testFile(data)
	let hashedFile = await hashFile({file: f.file, size: f.data.size(), protocolTips})
	let hashedStream = await hashStream({stream: f.stream, size: f.data.size(), protocolTips, protocolPieces})
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
	//^importantly, make sure we get the same tip hash from slicing the file and peeking at the stream!
	return ({seed, size, protocolPieces, protocolTips, hashedFile, hashedStream})
}

//leave on: smoke test hashing the file "hello"
test(async () => {

	//correct answers
	const correctTip32   = 'BSOEFHWYKUFE2ZEYFGKAE2X4IZXTXXCDJZQ2YRGKLMAETUJDTIHQ'
	const correctPiece32 = 'AD4G5U6L4LJC4DYUIUSFRIYHH5KMRVHCLOQQAKAPNNPFCRAUIV3Q'

	//same as if you save the 5 bytes "hello" in a file named hello.txt on disk, bucket, or dragged to page
	let {data, file, stream} = testFile(Data({text: 'hello'}))

	//smoke test the file and stream hashers
	ok(file.size == data.size())//our fake file knows its size
	let h1 = await hashFile({file,     size: file.size, protocolTips: hashProtocolTips})
	let h2 = await hashStream({stream, size: file.size, protocolTips: hashProtocolTips, protocolPieces: hashProtocolPieces})
	ok(h1.tipHash.base32() == correctTip32)//tip hash from file slicing
	ok(h2.tipHash.base32() == correctTip32)//tip hash from stream peeking
	ok(h2.pieceHash.base32() == correctPiece32)//piece hash from stream processing

	//confirm matching results when performing the hashing by hand ✏️
	ok((await hashText('Fuji.Tips.SHA256.4KiB.5.hello')) == correctTip32)//tip hash is of file data
	let d1 = Data({text: 'Fuji.Pieces.SHA256.4MiB.5.'})
	let d2 = await Data({text: 'hello'}).hash()//piece hash is of piece hashes
	let bin = Bin(d1.size() + d2.size())
	bin.add(d1)
	bin.add(d2)
	ok((await bin.hash()).base32() == correctPiece32)
})
//leave on: demonstration of tip hash only hitting the tips, and piece hash covering everything
test(async () => {
	let r, s, f, h1, h2, p, t

	//let's do some tests with the same algorithms, but with the piece size the same and way down to just 4 bytes
	r = {title: 'Test.Both.SHA256.4B.', size: 4}

	t = 'A6RAKFDY2XTFTXIXY443GJPPQOE7IEDWXCAKQ2DCYEIRRFQK3PBQ'
	p = 'HWRHKCB5OSVGTA365HAK22CMPTURM3DJY6553YQCJE7YCW5YQFEA'//correct answers
	s = 'FFFF....MMMMppppL'//file contents
	f = testFile(Data({text: s}))
	h1 = await hashFile({file: f.file, size: f.data.size(), protocolTips: r})
	h2 = await hashStream({stream: f.stream, size: f.data.size(), protocolTips: r, protocolPieces: r})
	ok(h1.tipHash.base32() == t)
	ok(h2.tipHash.base32() == t)
	ok(h2.pieceHash.base32() == p)

	s = 'FFFF!!!!MMMMppppL'//now we change just the part of the file the tip hasher can't see
	p = 'Z3SVWY6BAOECTYAS7UXMNH7RIXL63ZD6KYHG73HKBOSZUWOAKCJQ'//the piece hash will be different...
	f = testFile(Data({text: s}))
	h1 = await hashFile({file: f.file, size: f.data.size(), protocolTips: r})
	h2 = await hashStream({stream: f.stream, size: f.data.size(), protocolTips: r, protocolPieces: r})
	ok(h1.tipHash.base32() == t)
	ok(h2.tipHash.base32() == t)//...but the tip hash will be the same
	ok(h2.pieceHash.base32() == p)
})

//turn on: demonstration with small files and tiny random protocol piece sizes
noop(async () => {
	let protocolPieces = {title: 'Test.Pieces.SHA256.9B.', size: randomBetween(10, 20)}
	let protocolTips   = {title: 'Test.Tips.SHA256.9B.', size: randomBetween(5, 15)}
	let seed = randomBetween(420, 6969)
	let size = randomBetween(1, 2000)
	let {hashedFile, hashedStream} = await testHashFile({seed, size, protocolPieces, protocolTips})
	log(`small files and pieces
${seed} seed and ${size} size
${protocolPieces.size} byte pieces and ${protocolTips.size} byte tips, all chosen randomly

${hashedFile.tipHash.base32()} tip hash from file slicing
${hashedStream.tipHash.base32()} tip hash from stream peeking, must be the same!
${hashedStream.pieceHash.base32()} piece hash from stream
`)
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
})
//turn on: fuzz testing random tiny files with tiny random piece sizes, and realistic files with actual piece sizes
noop(async () => {
	let cycles1 = await testCycle(4*Time.second, async () => {//small files and tiny block sizes
		await testHashFile({
			seed: randomBetween(420, 6969),
			size: randomBetween(1, 500),
			protocolPieces: {title: 'Test.Pieces.SHA256.10-20B.', size: randomBetween(10, 20)},
			protocolTips: {title: 'Test.Tips.SHA256.5-15B.', size: randomBetween(5, 15)},
		})
	})
	let cycles2 = await testCycle(4*Time.second, async () => {//realistic files and protocol block sizes
		await testHashFile({
			seed: randomBetween(420, 6969),
			size: randomBetween(1, 20*Size.mb),
			protocolPieces: hashProtocolPieces,
			protocolTips: hashProtocolTips,
		})
	})//only able to get a few dozen of these even on a fast new Mac
	log(cycles1, cycles2)
})
//turn on: run in local node and takes ~40s; automated test with realistic file sizes and actual block sizes
noop(async () => {
	async function f(tip, piece, seed, size) {
		let {hashedFile, hashedStream} = await testHashFile({seed, size, protocolPieces: hashProtocolPieces, protocolTips: hashProtocolTips})
		ok(hashedFile.tipHash.base32() == tip)
		ok(hashedStream.tipHash.base32() == tip)
		ok(hashedStream.pieceHash.base32() == piece)
		log(`hashed to expected test vectors: ${saySize4(size)}`)
	}
	log('small files 📕 (4)')
	await f('AMYQHWDMVF3VL53SZUKK7Q5RAW6VSEEOPLNX6IQ3ALOC5XFURA4A', 'CPJS4X3PANIYH2ZLJQD3UZPW5EVNRVLH2KEMGAB3WI7JQBHXH5EQ', 2862, 51187)
	await f('MWK5MHONGJQYDXRNGAYPPNJPRVNIJXPXTW2FR7M5WVAFNH77KO5Q', 'UBV4ETJPZLZART3UXGUDTUT67GZKBSJALIK5O5YQCD7OLPPJOWRA', 3518, 177797)
	await f('2TKO5PBE74VSTTRYKCDEF2KV35WAASJADKED76VMVX66444I7RWQ', 'ICJNIKS2PW4YOKFR62EIT2RVE4EKEDUFOOWRBVGEEDEUYDMZY2VQ', 2203, 6754)
	await f('3IK3MMRBSUXKMKVTY4YUCJWZAJUTUQGDLNWBVIUZCZMAY5X3EYDA', '5LDT2E4IG6OMPSEKCDT6676DFQIIY7T6Z4LCOMGGDO75P225JQFQ', 943, 132393)
	log('medium files 🖼️ (4)')
	await f('VWRSG24XQKGZK2I2U77JZNUNK2BDTLXUUPAUN2NTUPTINTCT5WBQ', '6YXR7CGK5TV7QO4HZUT3W6F3CIX4O6IY7WCPZWDP7ACWLLJDGNYA', 1145, 28148451)
	await f('3UHG26C6MLS3DDNBQIEPWKI23P7TBXTLW36ENWYOFTDSLMOS2MRA', 'I464HASPP45J62P4IC3ANMDWMJKWGLSKBTJQGYLD4PQ5KQIPFEJQ', 6317, 5911493)
	await f('FI5OSG7AGTDWIC7EGIOCT4RHUZ3ML2K4JALXH4F2SNMHSQKA666Q', '63TIRHGUKSBOI54P6BPFW56GVCOIKXGWVQEDY353P6S4MX7YZIMA', 927, 6427647)
	await f('PGLRDZOHYXW6MTTQ4RQX5GSJM3TVNURKREKJYM73VTIDOJXR5TQA', '7RU4CHSZ6LD22FEGFVBNF4IDNEWBFCKK6QZSGZNF5YSXAP4GBASA', 1096, 19708296)
	log('big files 📹 (4)...')
	await f('XTOKZZBBTN3EHKHNZFYT55CDZHP33NAHTAL2OLBFDQUVF7HJTZPA', 'EJOSKBIJDV4ZIRVUYSQXOJXU7JU2YSTGIS4PPYUX5K53B3CM3XOQ', 778, 387949882)
	await f('FBTSGC4JZHWSL7L5HHAP7K26BQVIIXT2BFOWQZSKU5KUIM25GANQ', 'COSQGIS5MWFTSVWQXKG2EHQKOQ5JIZA7MRBDUYLJMFWIMWSAJO7Q', 767, 1769800008)
	await f('6Q542GBQQJ7BOE6PHTCXVN2JAHCI6BFLFWJ5UUJP7X7O6XGEBIAQ', '5A5KZL546N4C73EEKLCDE3XT5CRSXYFCUOGPDH35SOARXBD6TGSA', 707, 467851037)
	await f('AJMLQ7IVP5R7XXC2VXVQ2744QH2DULKPKETHBXW4UIBH67UBXPMA', 'ZQE2JBMTUZY7WBHI2MWED4GG3YDCVCQDXOE3FNIDVV2Y5VZT2JXA', 5860, 2827821563)
})
//turn on: code you used to create test vectors above
noop(async () => {
	let {seed, size, hashedFile, hashedStream} = await testHashFile({
		seed: randomBetween(420, 6969),
		size: randomBetween(1, 9*Size.mb),//set the desired size range here
		protocolPieces: hashProtocolPieces,
		protocolTips: hashProtocolTips})
	log(`realistic files and actual pieces
${seed} seed
${size} size (${saySize4(size)})

${hashedFile.tipHash.base32()} tip hash from file slicing
${hashedStream.tipHash.base32()} tip hash from stream peeking, must be the same!
${hashedStream.pieceHash.base32()} piece hash from stream
`)
	ok(hashedFile.tipHash.base32() == hashedStream.tipHash.base32())
})

//turn on: try out on the command line with real files $ yarn test ~/Downloads/big.mov
noop(async () => {
	const node = await loadNode()
	let name = process.argv[2]
	let size = node.fs.statSync(name).size
	let stream = node.stream.Readable.toWeb(node.fs.createReadStream(name))//convert from Node-style stream to isomorphic WHATWG stream
	log(`Hashing "${name}" (${commas(size)} bytes)...`)
	let hash = await hashStream({
		stream,
		size,
		protocolPieces: hashProtocolPieces,
		protocolTips: hashProtocolTips,
		onProgress: (hash) => {
			let percent = (hash.hashedSize / hash.totalSize)*100
			process.stdout.write(`\r${percent.toFixed(1)}%... `)
		}
	})
	log(`

${hash.pieceHash.base32()} piece hash
${hash.tipHash.base32()} tip hash
Summed ${saySize4(size)} in ${commas(hash.duration)}ms (${commas(Math.round(hash.totalSize / hash.duration))} bytes/ms)
`)//seeing ~950k+ on your Mac
})

















































//  _           _                    __                              _     
// (_)_ __   __| | _____  __   ___  / _|  _ __ ___  ___ ___  _ __ __| |___ 
// | | '_ \ / _` |/ _ \ \/ /  / _ \| |_  | '__/ _ \/ __/ _ \| '__/ _` / __|
// | | | | | (_| |  __/>  <  | (_) |  _| | | |  __/ (_| (_) | | | (_| \__ \
// |_|_| |_|\__,_|\___/_/\_\  \___/|_|   |_|  \___|\___\___/|_|  \__,_|___/
//                                                                         
/*
the given array a is a list of records, each with a unique .tag
the array is sorted recent first, using .tick (and tag as a tiebreaker)

arrays of records like this come sorted from the database,
are kept in Pinia stores through universal rendering,
(which includes stringification across the server->client bridge,
and then hydration back into reactive state on the client)
and then get used to drive lists of Vue components on the page with v-for
either directly, or with filtering through a computed property

to handle them easily and efficiently, while keeping out of Pinia and Vue's way
make an index around them with let index = indexRecords(refArray.value)
and then you can addRecords(refArray.value, [possibly new or updated records], index)

addRecords() brings in records with tags we don't have yet (fast for immutable records)
mergeRecords() does that, and also updates objects with tags we do have (necessary for updated records)
add is designed to be really fast, and not bother Vue at all, if you add a bunch we already have!

index.o[tag] enables instant lookups when you already know the tag you want

these functions edit a in place, and keep it sorted
add is fast given records that are sorted (probably by the database)
feeding in unsorted records will work, but not be fast (so don't do that)

under the hood, index keeps a single mutable cursor i to avoid a full scan for every add
there is also no binary search! with everything sorted,
realizing we're already in or very close to the right spot is faster
*/
export function indexRecords(a) {//array of records, sorted descending by tick, using tag as a tiebreaker
	let index = {
		o: {},//object of records for instant lookup by known tag
		i: 0,//an internal cursor we move and keep to bring in sorted records quickly
	}
	if (!recordsAreSortedAlready(a)) sortRecords(a)
	a.forEach(r => index.o[r.tag] = r)//build o to let us quickly look up tags in a
	return index
}
export function addRecords(a, a2, index)   { placeRecords({a, a2, index, replace: false}) }//add records with tags we don't have yet
export function mergeRecords(a, a2, index) { placeRecords({a, a2, index, replace: true})  }//also bring in new objects for tags we do have

function recordsAreSortedAlready(a) {
	for (let i = 1; i < a.length; i++) {
		if (a[i-1].tick < a[i].tick || (a[i-1].tick == a[i].tick && a[i-1].tag < a[i].tag)) {
			return false
		}
	}
	return true
}
function sortRecords(a) {
	a.sort((l, r) => r.tick - l.tick || (r.tag > l.tag ? 1 : -1))
}
function walkRecords(a, r, index) {//move forward first, then back
	while (index.i < a.length && (a[index.i].tick   > r.tick || (a[index.i].tick   == r.tick && a[index.i].tag   >= r.tag))) index.i++
	while (index.i > 0        && (a[index.i-1].tick < r.tick || (a[index.i-1].tick == r.tick && a[index.i-1].tag <= r.tag))) index.i--
	/*
	we use walk both to find an existing record, and to find the correct insertion point for a new one
	if r is an element in a, walk will find its index--r.tag and r.tick match exactly in this case
	if r is new to a, walk will choose where we should put it--r.tag is not in a in this case
	walk keeps i in range, except to indicate a new r should be added last
	*/
}
function placeRecords({a, a2, index, replace}) {
	if (!a2) return//it's fine to call this with nothing to add

	if (!(Array.isArray(a) && Array.isArray(a2) && index && index.o && Number.isInteger(index.i))) toss('type')
	if (a.length)  { checkInt(a[0].tick);  checkTag(a[0].tag)  }//if the first record is ok they likely all are
	if (a2.length) { checkInt(a2[0].tick); checkTag(a2[0].tag) }
	//^quick sanity checks; guard against mistakes like a missing parameter or incorrectly dereferenced response object

	for (let r2 of a2) {

		//find
		let r = index.o[r2.tag]//do we already have a record with this tag?

		//remove
		if (r && replace) {//if found and this is a merge, remove the outdated record
			walkRecords(a, r, index)//move i to the existing record--we know it's in there so walk will find it!
			a.splice(index.i, 1)//at i, remove 1 record
			r = null//indicate removal locally so the insert next happens
		}

		//insert
		if (!r) {//not found to begin with, or found, this is a merge, so removed
			walkRecords(a, r2, index)//use walk again to move i to the correct place to add r2
			a.splice(index.i, 0, r2)//add the new record to the array
			index.o[r2.tag] = r2//add or replace the reference in the object
		}

		//note how if merge is false and a2 has no new tags, this quickly does nothing, which is great!
	}
}
noop(() => {//template for sanity checking:
	let a = []
	let index = indexRecords(a)
	let a2 = [
		{tick: 3, tag: 'Fiiiiiiiiiiiiiiiiiiii', edition: 'first edition'},
		{tick: 3, tag: 'Diiiiiiiiiiiiiiiiiiii', edition: 'first edition'},
		{tick: 3, tag: 'Biiiiiiiiiiiiiiiiiiii', edition: 'first edition'},
	]
	addRecords(a, a2, index)
	log('----')
	a2 = [
		{tick: 2, tag: 'Biiiiiiiiiiiiiiiiiiii', edition: 'second edition'},
		{tick: 2, tag: 'Diiiiiiiiiiiiiiiiiiii', edition: 'second edition'},
		{tick: 2, tag: 'Fiiiiiiiiiiiiiiiiiiii', edition: 'second edition'},
	]
	mergeRecords(a, a2, index)
	log(look(a), `lengths are ${a.length} and ${Object.keys(index.o).length}`)
})
noop(() => {//and a rudimentary fuzz buster:
	function run1(capacity, timeRange) {
		let a = []
		let index = indexRecords(a)
		let now = Now()
		for (let t = 1; t <= capacity; t++) {
			addRecords(a, [{tag: Tag(), tick: randomBetween(now - timeRange, now)}], index)
			//this is slow because we're intentionally not giving add sorted records

			//make sure the array has the right number of items
			ok(a.length == t && Object.keys(index.o).length == t)
			//and that they're sorted by tick, at least
			for (let i = 0; i < a.length - 2; i++) ok(a[i].tick >= a[i+1].tick)
		}
	}
	function run2(seconds, timeRange, capacity) {
		let now = Now()
		let cycles = 0
		while (Now() < now + (seconds * Time.second)) {
			run1(capacity, timeRange)
			cycles++
		}
		log(`did ${cycles} cycles with capacity ${capacity} in ${seconds} seconds`)
	}
	const seconds = 4
	const timeRange = Time.minute//like Time.year, or 10 to pile up tick collisions, which are ok
	run2(seconds, timeRange, 4)//lots of cycles building to a very short array to test all the corners
	run2(seconds, timeRange, 16)
	run2(seconds, timeRange, 256)
})



























//generate some dummy posts
noop(() => {

	let quantity = 50
	let durationShort = 5*Time.minute
	let durationLong = 5*Time.day

	let n = Now()
	let when = n
	let earlier
	let s = ''
	for (let i = quantity; i >= 1; i--) {
		earlier = randomBetween(durationShort, durationLong)
		when -= earlier
		s += `\r\n{tag: '${tag()}', post: ${i}, quantity: ${quantity}, tick: ${when} },`
	}
	//log(s)
})
export function generatePosts(quantity) {
	let durationShort = 5*Time.minute
	let durationLong = 5*Time.day

	let posts = []

	let n = Now()
	let when = n
	let earlier
	let s = ''
	for (let i = quantity; i >= 1; i--) {
		earlier = randomBetween(durationShort, durationLong)
		when -= earlier

		posts.push({
			tag: Tag(),
			order: i,
			quantity: quantity,
			tick: when
		})
	}
	return posts
}
//dummy posts, later this will come from the database and be in pinia
let chronology = [
{tag: 'Fouv7hYGoytFMpU8JF0Fp', order: 50, quantity: 50, tick: 1716455539307 },
{tag: '9ybmRRMv7DkyyblkNvg7T', order: 49, quantity: 50, tick: 1716321894639 },
{tag: 'YnzMXqUGaU4yh1n8LdHag', order: 48, quantity: 50, tick: 1716137928364 },
{tag: 'HT11n28Iv82hlhuuSzCb0', order: 47, quantity: 50, tick: 1715978704727 },
{tag: 'hs5Ay6ZABoMOGFzBi1oyh', order: 46, quantity: 50, tick: 1715648092892 },
{tag: 'Rk9AeVaKsilRvwOO3YUfB', order: 45, quantity: 50, tick: 1715385111004 },
{tag: 'mTOttOiS3rR69OGjG1tvR', order: 44, quantity: 50, tick: 1715044766727 },
{tag: 'x32NK6ZDoRsmQbfSLZlGa', order: 43, quantity: 50, tick: 1714931303495 },
{tag: 'IE2VL7Co0Jt7q8dYXOXAt', order: 42, quantity: 50, tick: 1714727333266 },
{tag: 'O86XsWlaz4ta6cx16Q7IM', order: 41, quantity: 50, tick: 1714363110198 },
{tag: 'W78qwx7RwEgS26oEpUO2T', order: 40, quantity: 50, tick: 1714110838500 },
{tag: 'LWWpEotd0bsjnG7ARxkBA', order: 39, quantity: 50, tick: 1713728874624 },
{tag: 'rgLlcizQTbTrZwGwO52zf', order: 38, quantity: 50, tick: 1713419320801 },
{tag: 'ATALdIvNGgt57cTJdB1c3', order: 37, quantity: 50, tick: 1713378099230 },
{tag: 'IA6ZVmwZe4nxpRsqYdGC7', order: 36, quantity: 50, tick: 1713083064140 },
{tag: 'gzlKuZRrkq1QpVLQCWR1r', order: 35, quantity: 50, tick: 1712766656712 },
{tag: 'z7BWH5VzkdNEULWgX31CF', order: 34, quantity: 50, tick: 1712483923373 },
{tag: 'wH6vP23TMG3rSlogxIGKq', order: 33, quantity: 50, tick: 1712201991357 },
{tag: 'sKvZMRbUq10xnKjWMCuyH', order: 32, quantity: 50, tick: 1711795470621 },
{tag: 'xWeTKhoDh3vhI59eFTifV', order: 31, quantity: 50, tick: 1711740761762 },
{tag: 'RqzYoas2kdMLiy72e4ylN', order: 30, quantity: 50, tick: 1711399164136 },
{tag: 'qWW3MiOR6YV030VVsGs5l', order: 29, quantity: 50, tick: 1711157229938 },
{tag: 'G0QonkoCrx4tFom7kSjJQ', order: 28, quantity: 50, tick: 1711017080027 },
{tag: 'h9TKbMVxibNS94K0IKWu8', order: 27, quantity: 50, tick: 1710589463969 },
{tag: 'Xs57uky9VVJCnlEKEKea3', order: 26, quantity: 50, tick: 1710406061724 },
{tag: '6xUq3iwNvq24v6D3p7sdA', order: 25, quantity: 50, tick: 1709982957175 },
{tag: 'o4OJyHuH0G8qMfU8jSjkd', order: 24, quantity: 50, tick: 1709922737734 },
{tag: 'hM9jPxQSEEQBPxpHgiy18', order: 23, quantity: 50, tick: 1709672309425 },
{tag: 'AHkhsJ6EI8EM74M6zOy4A', order: 22, quantity: 50, tick: 1709241302124 },
{tag: 'F0VnEssG3rBUnF9HgkGC5', order: 21, quantity: 50, tick: 1708866753652 },
{tag: 'm036IiUkKGb899qGm8Np5', order: 20, quantity: 50, tick: 1708865723854 },
{tag: 'a3iY4QrGgqLASGWxWKpre', order: 19, quantity: 50, tick: 1708632254442 },
{tag: 'iCK0dTjFmXLeBTU2nyTx2', order: 18, quantity: 50, tick: 1708238475629 },
{tag: '4Tq6gURegueqbaug0vX0h', order: 17, quantity: 50, tick: 1708233767474 },
{tag: '56w1qDkNFyh1tykDfSW1z', order: 16, quantity: 50, tick: 1708206341461 },
{tag: 'aYfrIBit0gEevxyfSelzt', order: 15, quantity: 50, tick: 1707922248322 },
{tag: 'KAPNlvFDNpmOgCv0ksXlf', order: 14, quantity: 50, tick: 1707600171924 },
{tag: 'qoiOzOtBL1FxXXK4YSMWk', order: 13, quantity: 50, tick: 1707565602894 },
{tag: 'mDXOc16VmJ7MZmzlhArMm', order: 12, quantity: 50, tick: 1707355962825 },
{tag: 'EoF4DYlrR91pLwSn7vmbp', order: 11, quantity: 50, tick: 1707119235799 },
{tag: 'Q1OYdbUFVEHDE6coAjaqX', order: 10, quantity: 50, tick: 1707061636419 },
{tag: 'xmnlLx7N9n2YUzc58hWXY', order: 9, quantity: 50, tick: 1706702919517 },
{tag: 'RvXFcD5hiJijULzNwDDIO', order: 8, quantity: 50, tick: 1706662889740 },
{tag: 'nHsGz0kci0pdHdcYap3hr', order: 7, quantity: 50, tick: 1706287711293 },
{tag: 'oJarvWJkgYVD6btLeBndw', order: 6, quantity: 50, tick: 1706010726346 },
{tag: 'Ro36gVRki4uMClr6yXDW0', order: 5, quantity: 50, tick: 1705972706981 },
{tag: 'BqfnanFuCe8JxvdIJZ5ZZ', order: 4, quantity: 50, tick: 1705924197816 },
{tag: '4BpTznQcnkrZ1gdYoBzO5', order: 3, quantity: 50, tick: 1705727680431 },
{tag: 'NXLKpaWtjJFSjdfQkTexw', order: 2, quantity: 50, tick: 1705413227926 },
{tag: 'NR0vIdQZAwnEjhCZWe1ca', order: 1, quantity: 50, tick: 1705246581770 },
]

let lookup = {}
for (let i = 0; i < chronology.length; i++) {
	let p = chronology[i]
	lookup[p.tag] = p
}
export const postDatabase = { lookup, chronology }
