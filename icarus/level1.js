
import {
Time,
Now, sayDate, sayTick,
noop, test, ok, toss, checkInt, hasText, Size,
log,
say, look,
checkText,
Data, randomBetween,
cut,
fraction, exponent, int, big, deindent, newline,
hashData, hashText, given,
} from './level0.js'

import {customAlphabet} from 'nanoid'//use to make unique tags
import Joi from 'joi'//use to validate email and card
import creditCardType from 'credit-card-type'//use to validate card
import {parsePhoneNumberFromString} from 'libphonenumber-js'//use to validate phone




















//                                          _                   
//  ___  __ _ _   _   _ __  _   _ _ __ ___ | |__   ___ _ __ ___ 
// / __|/ _` | | | | | '_ \| | | | '_ ` _ \| '_ \ / _ \ '__/ __|
// \__ \ (_| | |_| | | | | | |_| | | | | | | |_) |  __/ |  \__ \
// |___/\__,_|\__, | |_| |_|\__,_|_| |_| |_|_.__/ \___|_|  |___/
//            |___/                                             

export function checkNumerals(s) {//s must be one or many numerals
	checkText(s)
	if (onlyNumerals(s) != s) toss('validation mismatch', {s})
}
//remove all characters but the numerals 0-9
export function onlyNumerals(s) { return s.replace(/[^0-9]/g, '') }
test(() => {
	ok(onlyNumerals('') == '')
	ok(onlyNumerals('A') == '')
	ok(onlyNumerals('0123456789') == '0123456789')
	ok(onlyNumerals('  012345\t6789\r\n') == '0123456789')
	ok(onlyNumerals(' 0123456789 一二三 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ .-_ 🌴? yes ', '0123456789'))
})

//use to say "5 things" like `${n} thing${sayPlural(n)}`
export function sayPlural(i) {
	return i == 1 ? '' : 's'
}
test(() => {
	ok(sayPlural(0) == 's')//like "0 carrots"
	ok(sayPlural(1) == '') //like "1 carrot"
	ok(sayPlural(2) == 's')//like "2 carrots"
})

//group digits like "12,345"
export function sayGroupDigits(s, thousandsSeparator) {//pass comma, period, or leave out to get international ready thin space
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
	ok(sayGroupDigits('') == '')
	ok(sayGroupDigits('1234') == '1234')
	ok(sayGroupDigits('12345') == '12,345')
	ok(sayGroupDigits('-50') == '-50')
	ok(sayGroupDigits('-70800') == '-70,800')
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
	return `${sayGroupDigits(b+'')}${_magnitudes[u]} year${sayPlural(i)}`
}

// Describe big sizes and counts in four digits or less
export function saySize4(n)   { return _number4(n, 1024, [' bytes', ' KB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB']) }
export function sayNumber4(n) { return _number4(n, 1000, ['',       ' K',  ' M',  ' B',  ' T',  ' P',  ' E',  ' Z',  ' Y'])  }
function _number4(n, power, units) {
	var u = 0 // Start on the first unit
	var d = 1 // Which has a value of 1 each
	while (u < units.length) { // Loop to larger units until we can say n in four digits or less

		var w = Math.floor(n / d) // Find out how many of the current unit we have
		if (w <= 9999) return w + units[u] // Four digits or less, use this unit

		u++ // Move to the next larger unit
		d *= power
	}
	return n+'' // We ran out of units
}














//  _              
// | |_ __ _  __ _ 
// | __/ _` |/ _` |
// | || (_| | (_| |
//  \__\__,_|\__, |
//           |___/ 

//generate a new universally unique double-clickable tag of 21 letters and numbers
export function Tag() {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'//removed -_ for double-clickability, reducing 149 to 107 billion years, according to https://zelark.github.io/nano-id-cc/
	return customAlphabet(alphabet, Limit.tag)()//tag length 21, long enough to be unique, short enough to be reasonable, and nanoid's default length
}

//make sure a tag is exactly 21 letters and numbers, for the database
export function checkTagOrBlank(s) { if (s === ''); else checkTag(s) }
export function checkTag(s) { if (!hasTag(s)) toss('data', {s}) }
export function hasTag(s) {
	return (
		typeof s == 'string' &&
		s.length == Limit.tag &&
		/^[0-9A-Za-z]+$/.test(s)
	)
}
test(() => {
	ok( hasTag('AgKxru95C7jFp5iPuK9O7'))
	ok(!hasTag('AgKxru95C7jFp5iPuK9O7b'))//too long
	ok(!hasTag('AgKxru95C7jFp5iPuK9_7'))//invalid character

	ok(!hasTag(''))
	checkTagOrBlank('')
	checkTagOrBlank('21j3i1DJMw6JPkxYgTt1B')
})










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
	tag: 21,//tags are exactly 21 characters, like "JhpmKdxqPtxv6zXZWglBL"
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
	ok((await hashData(Data({random: 4}))).base32().length == Limit.hash)
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
	//ttd february
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

//ttd february
/*
checkNameNormal(nameNormal) makes sure nameNormal is a valid normalized route that doesn't change when we validate it
checkNamePage(namePage) makes sure namePage is a valid name for the page that doesn't change when we validate it
checkName(all three) makes sure that when we validate each of three they don't change, and also, that formal normalizes to normal!

maybe put those into a single checkName which acts on what it's given--or maybe that's much harder to reason about
*/

/*

*/


export function liveBox(s) {
	return
}






/*
^ttd february, so, do you need this? next make the choose/change your user name and route form to figure that out
wait--should checkRoute, for instance, also validate that as given, it doesn't change to normal?!
yes, it should--both check that the given text can be made valid and normal, and that the given text is alerady valid and normal
add that check to the other checkSomething editions
*/
//ttd february, you also need to block this list
//ttd february, maybe make these passed limits compulsory so below is simpler, and calls here are explicit; you have to say it in the html after all






//a cheat to bundle the validation trio into a v object, when it's from the database, so you don't need to check it
export function bundleValid(formNormal, formFormal, formPage) {//you really have to get the order right!
	checkText(formNormal); checkText(formFormal); checkText(formPage)//sanity check, even though you don't know what these are or what's valid for them, bundle, at least, needs them all to be something
	return {isValid: true, formNormal, formFormal, formPage}
}
//ttd march, is this a good idea? you're tried of typing out the three forms everywhere, and v could mean object from validate function





//ttd march, when you let the user choose their Formal and Page names, Formal->Normal must be available, and Page must not collide with Normal, either! this so you can make log in by name, and let the type any of the three forms


export function checkName({formPage, formFormal, formNormal}) {
	let message = _checkName({formPage, formFormal, formNormal})
	if (message != 'Ok.') toss(message, {formPage, formFormal, formNormal})
}
function _checkName({formPage, formFormal, formNormal}) {
	let validPage, validFormal, validNormal
	if (given(formPage)) {//remember that blank strings, while not valid, are falsey!
		validPage = validateName(formPage, Limit.name)
		if (!validPage.formPageIsValid) return 'page form not valid'//page form can be valid, but not validate into the other two; they can be separate
		if (validPage.formPage != formPage) return 'page form round trip mismatch'
	}
	if (given(formFormal)) {
		validFormal = validateName(formFormal, Limit.name)
		if (!validFormal.isValid) return 'formal form not valid'
		if (validFormal.formFormal != formFormal) return 'formal form round trip mismatch'
	}
	if (given(formNormal)) {
		validNormal = validateName(formNormal, Limit.name)
		if (!validNormal.isValid) return 'normal form not valid'
		if (validNormal.formNormal != formNormal) return 'normal form round trip mismatch'
	}
	if (given(formFormal) && given(formNormal)) {//after checking all given forms individually, also make sure formal normalizes into normal
		if (validFormal.formNormal != formNormal) return 'round trip mismatch between normal and formal forms'
	}
	return 'Ok.'
}
test(() => {
	//example use
	ok(_checkName({formPage: 'My Name', formFormal: 'My-Name', formNormal: 'my-name'}) == 'Ok.')//all valid and happen to match
	ok(_checkName({formPage: '2B', formFormal: 'TwoB', formNormal: 'twob'}) == 'Ok.')//all valid, with formal is custom from page

	ok(_checkName({formPage: ''})   != 'Ok.')//make sure blank is identified as not valid
	ok(_checkName({formFormal: ''}) != 'Ok.')
	ok(_checkName({formNormal: ''}) != 'Ok.')

	ok(_checkName({formPage:   ' '}) == 'page form not valid')//cannot be made valid, not ok
	ok(_checkName({formPage:   ' Untrimmed'}) == 'page form round trip mismatch')//have to be made valid, also not ok
	ok(_checkName({formFormal: 'Has Space'})  == 'formal form round trip mismatch')
	ok(_checkName({formNormal: 'Uppercase'})  == 'normal form round trip mismatch')

	//below, all four forms are valid individually...
	ok(_checkName({formFormal: 'Name-1', formNormal: 'name-1'}) == 'Ok.')//...and together
	ok(_checkName({formFormal: 'Name-1', formNormal: 'name-2'}) != 'Ok.')//...but not together!
})
const reservedRoutes = ['about', 'account', 'admin', 'administrator', 'app', 'ban', 'billing', 'blog', 'community', 'config', 'contact', 'creator', 'dashboard', 'developer', 'dm', 'e', 'f', 'fan', 'faq', 'feed', 'feedback', 'forum', 'help', 'home', 'i', 'legal', 'login', 'logout', 'manage', 'me', 'messages', 'moderator', 'my', 'notifications', 'official', 'privacy', 'profile', 'q', 'qr', 'register', 'report', 'root', 'search', 'settings', 'shop', 'signin', 'signout', 'signup', 'staff', 'status', 'store', 'subscribe', 'support', 'system', 'terms', 'unsubscribe', 'user', 'verify']//profile pages are on the root route; prevent a user from clashing with a utility or brochure page!
export function validateName(raw, limit) {//raw text from either the first (page) or second (link/route) boxes in the choose or change your user name form
	let cropped = cropToLimit(raw, limit, Limit.name)
	let formPage = trimLine(cropped)//"東京❤️女の子" valid for display on the page
	let formFormal = slug(cropped)//"Tokyo-Girl" working and correct route for links
	let formNormal = formFormal.toLowerCase()//"tokyo-girl" reserved to prevent duplicates, also a working route
	let isValid = hasText(formPage) && hasText(formFormal) && hasText(formNormal) && !reservedRoutes.includes(formNormal)
	let formPageIsValid = hasText(formPage)
	return {isValid, formNormal, formFormal, formPage, formPageIsValid, raw, cropped}
}
test(() => {
	function f(raw, normal, formal, page) {
		let v = validateName(raw)
		ok(v.formNormal == normal)
		ok(v.formFormal == formal)
		ok(v.formPage   == page)
	}
	let v = validateName('2 Rainbows 🌈🌈 4U ')//raw text from user that starts with number, contains emoji, and has an extra space at the end
	ok(v.formPage == '2 Rainbows 🌈🌈 4U')//text to display on the page, trimmed
	ok(v.formFormal == 'Rainbows-4U')//chosen route, case preserved
	ok(v.formNormal == 'rainbows-4u')//normalized route to confirm unique and then reserve--both of these routes work

	ok(!validateName('Terms').isValid)//format is valid, but normal form is reserved
})

//  _   _ _   _                        _                   _   
// | |_(_) |_| | ___    __ _ _ __   __| |  _ __   ___  ___| |_ 
// | __| | __| |/ _ \  / _` | '_ \ / _` | | '_ \ / _ \/ __| __|
// | |_| | |_| |  __/ | (_| | | | | (_| | | |_) | (_) \__ \ |_ 
//  \__|_|\__|_|\___|  \__,_|_| |_|\__,_| | .__/ \___/|___/\__|
//                                        |_|                  

export function validateTitle(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)
	let formNormal = trimLine(cropped)
	if (!hasText(formNormal)) return {formNormal, raw, cropped}
	return {isValid: true, formNormal, raw, cropped}
}

export function validatePost(raw, limit) {//returns an array of paragraphs
	let cropped = cropToLimit(raw, limit, Limit.post)
	let lines = trimLines(cropped)
	if (!hasText(lines.text)) return {raw, cropped}
	return {isValid: true, formNormal: lines.text, lines, raw, cropped}//normal form is single string with \n at the end of each line, also including lines, the array, which will be useful if this is going to get rendered into <p> tags or something on a web page
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
joi has 9 million downloads and installs 6 packages
credit-card-type has half a million downloads and installs 1 package
libphonenumber-js has 5 million downloads and installs 1 package

current limitations in email:
-joi has a built in TLD whitelist, but some error meant you turned off that check

current limitations in phone:
-you're assuming US rather than telling libphonenumber what country to fit to

current limitations in card:
-joi validates the card, but can't group digits
-credit-card-type groups digits, and detects type from what the user has typed so far
(ttd february, so why are you using both joi and credit-card-type? maybe just use credit-card-type)

data forms:
-raw, what the user put in the box
-adjusted, improved to make validation more likely to work, like trimmed or only digits
-presented, formatted for pretty human consumption, like grouping digits in a card number
-normalized, boiled down all the way to store in the database, and notice a duplicate

guaranteed data pathway:
raw -> formFormal -> formPage
									-> formNormal

email example:
formNormal, nee normalized: 'bobfrank@gmail.com',   heaviest changes, store in database to prevent a duplicate
formFormal, nee adjusted:   'Bob.Frank@GMAIL.COM',  light changes to pass validation; give to APIs
formPage,   nee presented:  'Bob.Frank@gmail.com',  heavier formatting, show back to the user on the page
raw:                        ' Bob.Frank@GMAIL.COM', what the user typed

and so what do you pass to the email or credit card API?
formFormal, in case the user's weird way of writing it actually matters
the log of exactly what you told the api records formFormal

keep formFormal and formNormal in the database
formNormal to quickly detect a duplicate
formFormal for a later repeat use with an API
and when composing text for the page, do formFormal -> formPage

uniformly, these validation functions take raw text from the user's keystrokes
and return an object like {isValid, formNormal, formFormal, formPage, raw, otherPartsOrDetails, ...}
*/

//             _ _     _       _                              _ _ 
// __   ____ _| (_) __| | __ _| |_ ___    ___ _ __ ___   __ _(_) |
// \ \ / / _` | | |/ _` |/ _` | __/ _ \  / _ \ '_ ` _ \ / _` | | |
//  \ V / (_| | | | (_| | (_| | ||  __/ |  __/ | | | | | (_| | | |
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|  \___|_| |_| |_|\__,_|_|_|
//                                                                

const periodIgnorers = ['gmail.com', 'googlemail.com', 'proton.me', 'protonmail.com', 'pm.me', 'protonmail.ch']//these providers, gmail and protonmail, deliver mail addressed to first.last@gmail.com to the user firstlast@gmail.com
const _email = Joi.string().email({tlds: {allow: false}}).required()//no list of true TLDs
export function checkEmail(raw, limit) { let v = validateEmail(raw, limit); if (!v.isValid) toss('form', {v}); return v }
export function validateEmail(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	/* (1) adjusted step for email
	trim space before and after
	don't touch space in the middle
	*/
	let formFormal = cropped.trim()
	let j1 = _email.validate(formFormal)
	if (j1.error) return {formFormal, raw, cropped, j1}//isValid not true on these early returns

	/* (2) presented step for email
	leave the name the same, but lowercase the domain
	BOBSMITH@SPINDEX.BIZ clearly has his caps lock on, but maybe his email only works if you shout at him
	TomStoppard@SpeedOfArt.net is used to seeing his domain flattened
	*/
	let p = cut(formFormal, "@")
	let formPage = p.before + "@" + p.after.toLowerCase()
	let j2 = _email.validate(formPage)
	if (j2.error) return {formFormal, formPage, raw, cropped, j2}

	/* (3) normalized step for email
	here, we want to prevent MrMorgan@example.com from creating a second account as mrmorgan@example.com
	additionally, we want to notice that mr.morgan@gmail.com is the same guy as mrmorgan@gmail.com; this is gmail-specific
	if we find others like this, we can add them here, but database data won't have gone through the latest validator
	*/
	let name = p.before.toLowerCase()
	let domain = p.after.toLowerCase()
	name = cut(name, '+').before//name+spam@example.com is really name@example.com
	if (periodIgnorers.includes(domain)) name = name.replace(/\./g, '')//first.last@gmail.com is really firstlast@gmail.com
	let formNormal = name + "@" + domain
	let j3 = _email.validate(formNormal)
	if (j3.error) return {formFormal, formPage, formNormal, raw, cropped, j3}

	return {isValid: true, formNormal, formFormal, formPage, raw, cropped}
}
test(() => {

	//sanity check
	ok(!validateEmail('').isValid)
	ok(validateEmail('name@example.com').isValid)
	ok(validateEmail(' First.Last@EXAMPLE.COM\r\n').isValid)

	//mistakes
	ok(!validateEmail('name#example.com').isValid)//spaces
	ok(!validateEmail('first last@example.com').isValid)//spaces
	ok(!validateEmail('first.last@example com').isValid)
	ok(!validateEmail('first@last@example.com').isValid)//two ats

	//dots
	ok(validateEmail('first.last@department.example.com').isValid)//correct
	ok(!validateEmail('first.last@example..com').isValid)
	ok(!validateEmail('first.last@.example.com').isValid)
	ok(!validateEmail('first.last@example.com.').isValid)
	ok(!validateEmail('first.last@example').isValid)

	//joi doesn't like edge dots in name, either. this one you weren't even sure about
	ok(!validateEmail('.name@example.com').isValid)
	ok(!validateEmail('name.@example.com').isValid)

	//four forms when valid
	function f(raw, formFormal, formPage, formNormal) {
		let v = validateEmail(raw)
		ok(v.isValid)
		ok(v.formFormal == formFormal)
		ok(v.formPage == formPage)
		ok(v.formNormal == formNormal)
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

//probably won't have these; instead should be part of the theorized validate form as a whole system? ttd march
export function validateEmailOrPhone(raw) {
	let vEmail = validateEmail(raw); if (vEmail.isValid) { vEmail.type = 'Email.'; return vEmail }
	let vPhone = validatePhone(raw); if (vPhone.isValid) { vPhone.type = 'Phone.'; return vPhone }
	return {email: vEmail, phone: vPhone}//not valid as either
}

//             _ _     _       _               _                      
// __   ____ _| (_) __| | __ _| |_ ___   _ __ | |__   ___  _ __   ___ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \ | '_ \| '_ \ / _ \| '_ \ / _ \
//  \ V / (_| | | | (_| | (_| | ||  __/ | |_) | | | | (_) | | | |  __/
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___| | .__/|_| |_|\___/|_| |_|\___|
//                                      |_|                           

export function checkPhone(raw, limit) { let v = validatePhone(raw, limit); if (!v.isValid) toss('form', {v}); return v }
export function validatePhone(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	let numerals = onlyNumerals(cropped)
	let assumedRegion//leave undefined if not US
	if (numerals.length == 10 ||//assume all 10 digit numbers are US
		(numerals.length == 11 && numerals[0] == '1'))//or they also typed the 1 at the start
		assumedRegion = 'US'

	let phone = parsePhoneNumberFromString(cropped, assumedRegion)
	if (!phone || !phone.isValid()) return {raw, cropped, assumedRegion, phone}

	let formNormal = phone.format('E.164')//as established by the International Telecommunication Union
	let formFormal = formNormal//use E.164 with APIs, also
	let formPage = phone.formatInternational()//prettier, with spaces, for the user to see on the page
	if (!hasText(formNormal) || !hasText(formPage)) return {formNormal, formFormal, formPage, raw, cropped, assumedRegion, phone}

	return {isValid: true, formNormal, formFormal, formPage, raw, cropped, assumedRegion, phone}
}
test(() => {
	ok(!validatePhone('').isValid)//blank
	ok(!validatePhone('5551234').isValid)//local
	ok(!validatePhone('pizza').isValid)//nonsense

	function f(country, formNormal, raw, formPage) {
		let v = validatePhone(raw)
		ok(v.isValid)
		ok(v.phone.country == country)
		ok(v.formPage == formPage)
		ok(v.formNormal == formNormal)
	}

	//common typing
	f('US', '+14155552671',   '4155552671', '+1 415 555 2671')
	f('US', '+14155552671',  '14155552671', '+1 415 555 2671')
	f('US', '+14155552671', '+14155552671', '+1 415 555 2671')
	//forms ^Normal & Formal; ^raw;          ^Page, in this test, above and below in that order

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

const _card = Joi.string().creditCard().required()
export function checkCard(raw, limit) {}//ttd february, you never added this one
export function validateCard(raw, limit) {
	let cropped = cropToLimit(raw, limit, Limit.title)

	/* (1) adjusted step for credit card number
	just numerals, removing spaces, dots, dashes
	/* (2) this is the normalized form
	*/
	let formNormal = onlyNumerals(cropped)

	/* (3) intermediate step for a number the user hasn't finished typing yet
	use braintree's credit-card-type module to get the type
	this module also tells you how to group the numerals
	*/
	let cardType = creditCardType(formNormal)//from npm credit-card-type
	if (!cardType.length) return {formNormal, raw, cropped, cardType, note: 'no type'}//cardType should be an array of at least one possible type
	let gaps = cardType[0].gaps//go with first identified type, but know that there can be several
	let gap = 0//index in the array of gaps
	let formPage = ''
	for (let i = 0; i < formNormal.length; i++) {//loop for each numeral
		if (gap < gaps.length && i == gaps[gap]) {//weve reached a gap position
			formPage += ' '//add a gap
			gap++//watch for the next gap
		}
		formPage += formNormal[i]//bring in this numeral
	}
	if (onlyNumerals(formPage) != formNormal) return {formNormal, formPage, raw, cropped, cardType, note: 'round trip mismatch'}

	/* (4) use joi to validate at the end
	*/
	let j1 = _card.validate(formNormal)//Joi will do the Luhn check, which credit-card-type can't do, so that's why we use both
	if (j1.error) return {formNormal, formPage, raw, cropped, cardType, j1}

	return {isValid: true, formNormal, formPage, raw, cropped, cardType}//also return the detected type information
}
test(() => {

	//chatgpt's list of valid international credit card numbers
	ok(validateCard('4111 1111 1111 1111').isValid) // Visa
	ok(validateCard('5555 5555 5555 4444').isValid) // MasterCard
	ok(validateCard('3782 822463 10005').isValid) // American Express (Amex)
	ok(validateCard('6011 1111 1111 1117').isValid) // Discover
	ok(validateCard('3566 1111 1111 1113').isValid) // JCB (Popular in Japan)
	ok(validateCard('3056 9309 0259 04').isValid) // Diners Club International
	ok(validateCard('6759 6498 2643 8453').isValid) // Maestro (Popular in Europe)
	ok(validateCard('4000 0566 5566 5556').isValid) // Carte Bancaire (Popular in France)
	ok(validateCard('6304 0000 0000 0000').isValid) // Laser (Previously popular in Ireland)
	ok(validateCard('6071 7980 0000 0000').isValid) // NPS Pridnestrovie (Popular in Transnistria)

	//should be valid, and from the same list, but joi doesn't like them, which is fine, i guess
	ok(!validateCard('6211 1111 1111 1111').isValid) // China UnionPay (Popular in China)
	ok(!validateCard('5067 9900 0000 0000 0009').isValid) // Elo (Popular in Brazil)
	ok(!validateCard('6062 8288 0000 0000').isValid) // Hipercard (Popular in Brazil)
	ok(!validateCard('6071 9811 0000 0000').isValid) // RuPay (Popular in India)
	ok(!validateCard('6370 0028 0000 0000').isValid) // Interac (Popular in Canada)
	ok(!validateCard('5019 5555 5555 5555').isValid) // Dankort (Popular in Denmark)
	ok(!validateCard('5610 0000 0000 0000').isValid) // Bankcard (Popular in Australia)
	ok(!validateCard('2200 0000 0000 0000').isValid) // Mir (Popular in Russia)
	ok(!validateCard('4779 9990 0000 0000').isValid) // Zimswitch (Popular in Zimbabwe)

	//get the type soon as the user is typing, even when it's not valid yet
	function f(partial, type) {
		let v = validateCard(partial)
		ok(!v.isValid)//not valid yet
		ok(v.cardType[0].niceType == type)//name of first possible type identified
	}
	f('4111', 'Visa')
	f('55', 'Mastercard')//braintree says not internally capitalized
	f('3782 822', 'American Express')

	//four forms when valid
	function f2(raw, formPage, formNormal) {
		let v = validateCard(raw)
		ok(v.isValid)
		ok(v.formPage == formPage)
		ok(v.formNormal == formNormal)
	}
	f2('4111 1111 1111 1111',     '4111 1111 1111 1111', '4111111111111111')
	f2('4111111111111111',        '4111 1111 1111 1111', '4111111111111111')
	f2('4111-1111-1111-1111',     '4111 1111 1111 1111', '4111111111111111')
	f2('4111 1111 1111 1111\r\n', '4111 1111 1111 1111', '4111111111111111')
	f2('3782 822463 10005',  '3782 822463 10005', '378282246310005')
	f2('3782 8224 6310 005', '3782 822463 10005', '378282246310005')
})

//             _ _     _       _             _       _       
// __   ____ _| (_) __| | __ _| |_ ___    __| | __ _| |_ ___ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \  / _` |/ _` | __/ _ \
//  \ V / (_| | | | (_| | (_| | ||  __/ | (_| | (_| | ||  __/
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___|  \__,_|\__,_|\__\___|
//                                                           

export const months3 = ['',//Jan at index 1, Dec at 12
	'Jan', 'Feb', 'Mar', 'Apr',
	'May', 'Jun', 'Jul', 'Aug',
	'Sep', 'Oct', 'Nov', 'Dec']
export function checkDate(raw) { let v = validateDate(raw); if (!v.isValid) toss('form', {v}); return v }
export function validateDate(raw) {
	let adjusted = onlyNumerals(raw)
	adjusted = cropToLimit(adjusted, undefined, 8)//"YYYYMMDD" is 8 characters
	if (adjusted.length != 8) return {isValid: false, raw}
	let year  = parseInt(adjusted.slice(0, 4), 10)
	let month = parseInt(adjusted.slice(4, 6), 10)
	let day   = parseInt(adjusted.slice(6, 8), 10)
	if (year  < 1869 || year  > 9999 ||//sanity check bounds for a current date of birth
			month <    1 || month >   12 ||
			day   <    1 || day   >   31) return {isValid: false, raw, year, month, day}
	return {//return an object with properties to match our validation pattern
		isValid: true,
		formNormal: adjusted,//store in database to record and identify duplicates
		formFormal: adjusted,//not really used, would be the form we would hand to an API
		formPage: `${year}-${months3[month]}-${day}`,//form to show to the user on the page
		raw,//exactly the string we were given
		year, month, day,//component information for use by code, these are numbers, not text, for instance
	}
}
test(() => {
	let v = validateDate('20030525')
	ok(v.isValid && v.year == 2003 && v.month == 5 && v.day == 25)
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

	const date_fromPage = new Date(//make a reasonably trusted date for the page
		now_fromClock -//by starting with the trusted server time here where we're running,
		(offsetMinutes_fromPage*Time.minute)//and moving that by the sanity checked time zone offset the page told us
	)
	const year_fromPage  = date_fromPage.getUTCFullYear()
	const month_fromPage = date_fromPage.getUTCMonth() + 1//add 1 so January isn't 0
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





















//  _                    _________    ____  _____ ____ _  _    __   _  _    ___  
// | |__   __ _ ___  ___|___ /___ \  |  _ \|  ___/ ___| || |  / /_ | || |  ( _ ) 
// | '_ \ / _` / __|/ _ \ |_ \ __) | | |_) | |_ | |   | || |_| '_ \| || |_ / _ \ 
// | |_) | (_| \__ \  __/___) / __/  |  _ <|  _|| |___|__   _| (_) |__   _| (_) |
// |_.__/ \__,_|___/\___|____/_____| |_| \_\_|   \____|  |_|  \___/   |_|  \___/ 
//                                                                               
/*
base32
to store sha256 hash values in the database in a column typed CHAR(52)
you want something short, and double-clickable, and length independent of data
AI4APBJZISGTL4DOOJRKYPSACN4YSR55NVOJDZCKGXFKEX4AEJHQ, for example

https://www.npmjs.com/package/rfc4648
~1 million weekly downloads
installed into icarus, and not the nuxt project

but Data is in level0
using that module would require elevating Data to level1
so you're bringing your own short functions
and this fuzz tester confirms they work the same as the module

using pad false and loose true
but Data will do a round-trip check
*/
//import { base32 } from 'rfc4648'//only available in icarus
function cycle4648(size) {
	let d = Data({random: size})
	let s1 = base32.stringify(d.array(), {pad: false})
	let s2 = d.base32()
	ok(s1 == s2)
	let d1 = Data({array: base32.parse(s1, {loose: true})})
	let d2 = Data({base32: s2})
	ok(d1.base16() == d2.base16())
}
function runFor(m, f) {
	let n = Now()
	let cycles = 0
	while (Now() < n + m) { cycles++; f() }
	return cycles
}
noop(() => {
	function f1() { let size = 32;                     cycle4648(size) }//size of hash value
	function f2() { let size = randomBetween(1, 8);    cycle4648(size) }//short
	function f3() { let size = randomBetween(1, 1024); cycle4648(size) }//longer

	let cycles1 = runFor(1*Time.second, f1)
	let cycles2 = runFor(1*Time.second, f2)
	let cycles3 = runFor(1*Time.second, f3)
	log(look({cycles1, cycles2, cycles3}))
})





/*
game plan
[]write a really simple example to get the walk function correct
[]build up into list
[]add a light add which doesn't replace objects if they're tags are already there
[]and then merge, the heavy one, which does
[]write a fuzz tester that includes lots of small lists and random updates
*/

function List2() {
	let a = []//an array of objects, sorted by their names
	let cursor = 0//an internal cursor we move to the correct position, and leave there to be fast next time

	function load(a2) { a = a2 }
	function walk(name) {
		log(name)
		while (cursor < a.length && a[cursor].name     > name) { cursor++; log('dn') }
		while (cursor > 0        && a[cursor - 1].name < name) { cursor--; log('up') }
	}
	function see() {
		return look({a, cursor})
	}

	return {cursor, a, load, walk, see}
}

noop(() => {
	let l = List2()
	l.load([
		{name: 'D'},
		{name: 'B'},
	])
	l.walk('E')
	log(l.see())//at this point, cursor should be 1, because we need to add B at the bottom

})


/*
here, we're implementing a simple sorting algorithm
a1 is a given array, with records that have r1.tick, a number, and r1.tag, a string
we have the guarantee that a1 is sorted descending by tick, and then by tag, as a tiebreaker
we also have the guarantee that tags are universally unique--in a, and in the world

cursor is a given starting insertion point
we have the guarantee that it is a valid index in a

r2 is a new element that we are looking for the right place for in a1
it may be in a1 already, if so, then walk must find it
alternativvely, it may be a new item for a1, if so, then walk must find the correct insertion point for it
*/
function walk(a1, cursor, r2) {
	log('', `walking from ${cursor}`)

	while (cursor < a1.length &&
		(
			a1[cursor].tick > r2.tick ||
			(a1[cursor].tick == r2.tick && a1[cursor].tag >= r2.tag)
		)) { cursor++; log('dn to '+cursor) }
	while (cursor > 0 &&
		(
			a1[cursor - 1].tick < r2.tick || 
			(a1[cursor - 1].tick == r2.tick && a1[cursor - 1].tag <= r2.tag)
		)) { cursor--; log('up to '+cursor) }

	log(`returning cursor ${cursor}`)
	return cursor
}
noop(() => {
	/*
	[]first, do all the find cases, r2 will be exactly in r1, both the tick and tag will match
		[]same tick
		[]different ticks
	[]then, look at the insert cases, tag will always be not there yet, tick can be anything
		[]same tick
		[]different ticks

	all that for a starting list of
	[x]0
	[x]1, found it, now find insertion point scanning [x]ticks, different tags
	[x]2, found it first and second; then insertion points scanning [x]tags, [x]ticks
	[x]3, found it first/second/third; then insertion points scanning [x]tags, [x]ticks
	*/
	let a1 = [
		{tick: 3, tag: 'F', note: 'no edition'},
		{tick: 3, tag: 'D', note: 'no edition'},
		{tick: 3, tag: 'B', note: 'no edition'},
	]

	let r2 =
		{tick: 4, tag: 'C', note: 'no edition'}

	let length = a1.length
	function nudge(length, i) { if (i > length - 1) i = length - 1; if (i < 0) i = 0; return i }
	Array.from(new Set([
		nudge(length, 0),
		nudge(length, 1),
		nudge(length, Math.floor(length / 2)),
		nudge(length, length - 2),
		nudge(length, length - 1)
	])).forEach(cursor => {
		walk(a1, cursor, r2)
	})

})




function addOne(r, merge) {

	let r1 = o[r2.tag]//find
	if (r1 && merge) {
		//locate and remove
		r1 == null
	}
	if (!r1) {
		//add the new one
	}

}




function List() {
	const a = []//array of records, sorted descending by tick, using tag as a tiebreaker
	const o = {}//object of records for instant lookup by known tag
	let i = 0//an internal cursor we move and keep to merge in sorted additions quickly

	/*
	we use walk() both to find existing elements, and to find the correct insertion point for new ones
	if r is an element in a, walk() will find its index--r.tag and r.tick match exactly in this case
	if r is new to a, walk() will choose where we should put it--r.tag is not in a in this case
	walk() keeps i in range, except to indicate a new r should be added last
	*/
	function walk(r) {
		while (i < a.length && (a[i].tick   > r.tick || (a[i].tick   == r.tick && a[i].tag   >= r.tag))) i++
		while (i > 0        && (a[i-1].tick < r.tick || (a[i-1].tick == r.tick && a[i-1].tag <= r.tag))) i--
	}

	function add(a2)   { _add(a2, false) }//add records with tags we don't have yet
	function merge(a2) { _add(a2, true)  }//also bring in new objects for tags we do have
	function _add(a2, merge) {
		//if (!Array.isArray(a2)) toss('type', {a2})
		for (let r2 of a2) {
			//checkInt(r2.tick); checkTag(r2.tag)

			//find
			let r1 = o[r2.tag]//do we already have a record with this tag?

			//remove
			if (r1 && merge) {//if found and this is a merge, remove the outdated record
				walk(r1)//move i to the existing record--we know it's in there so walk will find it!
				a.splice(i, 1)//at i, remove 1 record
				r1 = null//indicate removal locally so the insert next happens
			}

			//insert
			if (!r1) {//not found to begin with, or found, this is a merge, so removed
				walk(r2)//use walk again to move i to the correct place to add r2
				a.splice(i, 0, r2)//add the new record to the array
				o[r2.tag] = r2//add or replace the reference in the object
			}

			//note how if merge is false and a2 has all existing tags, this quickly does nothing, which is great
		}
	}

	return {a, o, add, merge}
}
test(() => {
	/*
	ok, before your fuzz buster, you want to repeat simple sanity scans manually here, as you did above
	always be adding one item, beneath an existing array of

	[x]start with 0

	[]start with 1
	[]update
	[]then add, scanning tag and tick

	*/

	let list = List()
	list.add([
		{tick: 3, tag: 'F', edition: 'first edition'},
		{tick: 3, tag: 'D', edition: 'first edition'},
		{tick: 3, tag: 'B', edition: 'first edition'},
	])
	list.add([
		{tick: 2, tag: 'B', edition: 'second edition'},
		{tick: 2, tag: 'D', edition: 'second edition'},
		{tick: 2, tag: 'F', edition: 'second edition'},
	])
	log(look(list.a), `lengths are ${list.a.length} and ${Object.keys(list.o).length}`)



})


noop(() => {
	log('hi')
	log(Tag())

	let list = List()
	list.add([
		{tick: 5, tag: 'tagtagtagtagtagtagtaA', note: 'first edition'},
		{tick: 6, tag: 'tagtagtagtagtagtagtaC', note: 'first edition'},
		{tick: 5, tag: 'tagtagtagtagtagtagtaB', note: 'first edition'},
	])
	list.add([
		{tick: 5, tag: 'tagtagtagtagtagtagtaA', note: 'second edition'},
		{tick: 6, tag: 'tagtagtagtagtagtagtaC', note: 'second edition'},
		{tick: 5, tag: 'tagtagtagtagtagtagtaB', note: 'second edition'},
	])
	log(look(list))



})

/*
a co-worker wrote this quickly. let's figure out what it does, and if it does that correctly! the general idea is this is in the front end, in a pinia store. objects come in from the database, from fetch, and they might be new objects (that we don't have yet) or new versions of existing objects (with new properties that we don't deal with here). the member objects are guaranteed to have .tick, which is a timestamp from Date.now(), and .tag, which is a 21 character uuid from nanoid
*/





























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
