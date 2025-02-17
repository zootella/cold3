
import {
Time,
Now, sayDate, sayTick,
noop, test, ok, toss, checkInt, hasText, Size,
log,
say, look,
checkText, checkAlpha,
Data, randomBetween,
starts, cut,
onlyNumerals,
fraction, exponent, int, big, deindent, newline,
subtleHash, hash,
} from './level0.js'

import {customAlphabet} from 'nanoid'                        //use to make unique tags
import Joi from 'joi'                                        //use to validate email and card
import creditCardType from 'credit-card-type'                //use to validate card
import {parsePhoneNumberFromString} from 'libphonenumber-js' //use to validate phone














//       _                          _            
//   ___| |__   __ _ _ __ __ _  ___| |_ ___  ___ 
//  / __| '_ \ / _` | '__/ _` |/ __| __/ _ \/ __|
// | (__| | | | (_| | | | (_| | (__| ||  __/\__ \
//  \___|_| |_|\__,_|_|  \__,_|\___|\__\___||___/
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
	name: 42,//user names and route slugs can be up to 42 characters
	title: 280,//from twitter
	post: 2200,//for posts and comments, from instagram and tiktok

	//html form field limits
	input: 512,//higher ceiling for single line form fields
	area: 10000,//and for text areas, from twitter DMs and reddit posts
})
test(async () => {
	function f(s, characters, bytes) {
		ok(s.length == characters)
		ok(Data({text: s}).size() == bytes)
	}
	//we'll enforce the above limits with the easy and common s.length, while realizing percieved characters and actual bytes are not always the same!
	f('A', 1, 1)//simple letter A, one character, one byte
	f('é', 1, 2)//acute e, one character, two bytes
	f('😀', 2, 4)//emoji and instagram fonts can be more!
	f('𝓗', 2, 4)

	ok(Tag().length == Limit.tag)//program types
	ok((await subtleHash(Data({random: 4}))).base32().length == Limit.hash)
})























//  _              
// | |_ __ _  __ _ 
// | __/ _` |/ _` |
// | || (_| | (_| |
//  \__\__,_|\__, |
//           |___/ 

//generate a new universally unique double-clickable tag of 21 letters and numbers
export const tagLength = 21//we're choosing 21, long enough to be unique, short enough to be reasonable
export function Tag() {
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

export function checkTagOrBlank(s) {
	if (s === ''); else checkTag(s)
}
test(() => {
	checkTagOrBlank('')
	checkTagOrBlank('21j3i1DJMw6JPkxYgTt1B')
})

















//  _        _                             _   _ _                 
// | |_ _ __(_)_ __ ___     __ _ _ __   __| | | (_)_ __   ___  ___ 
// | __| '__| | '_ ` _ \   / _` | '_ \ / _` | | | | '_ \ / _ \/ __|
// | |_| |  | | | | | | | | (_| | | | | (_| | | | | | | |  __/\__ \
//  \__|_|  |_|_| |_| |_|  \__,_|_| |_|\__,_| |_|_|_| |_|\___||___/
//                                                                 

//split the given text into an array of lines, omitting blank lines, and trimming and coalescing space in each line
export function lines(s) {
	return (s
		.replace(/[\r\n\u2028\u2029]+/gu, '\n')//turn each group of any newlines into just \n all Mac classic-style
		.split('\n')//to then split the text into an array of lines
		.map(line => trim(line))//trim each line and collapse internal whitespace
		.filter(line => line.length > 0)//and omit blank lines
	 )
}
test(() => {
	ok(lines('\A\r\nB').length == 2)
	ok(lines('\nA\n\nB\n').length == 2)
})

//trim space from the ends of s, and coalesce multiple whitespace characters
export function trim(s) {
	return (s
		.replace(/[\t\n\r\u2028\u2029]/gu, ' ')//first, convert ascii and unicode tabs and newlines into normal spaces
		.trim()//remove whitespace from the ends
		.replace(/(\s)\s+/gu, '$1')//remove all but the first whitespace character in groups of two or more
	)
}
test(() => {
	ok(trim('a') == 'a')
	ok(trim('') == '')
	ok(trim(' ') == '')

	ok(trim('\nA\nB\n') == 'A B')
	ok(trim('\tIndented  wide\r\n') == 'Indented wide')

	ok(trim(`$12${thinSpace+thinSpace}345${middleDot}67`) == `$12${thinSpace}345${middleDot}67`)
	ok(trim('  First\u00A0 Last  ') == 'First\u00A0Last')//unicode nonbreaking space
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

	//this method is pretty good and very simple, but really only works for vowels:
	ok(deaccent('łódź') == 'łodz')
	//chat says maybe NFKD could get those; there are also npm modules for this like slugify
})

//sanitize text from the user that might be fine on the page for use in the URL, like a user name or post title
export function slug(s) {//will return blank if s doesn't have any safe characters at all!
	s = deaccent(s)//remove accents from vowels
	s = s.replace(/[-–—]+/g, '-')//simplify dashes
	s = s.replace(/[^A-Za-z0-9\s\-_.~]/gu, ' ')//allow all RFC 3986's unreserved characters, even tilde

	s = s.replace(/\s+/gu, ' ')//coalesce and convert groups of ascii and unicode space, tab, and new line characters into single spaces, note gu where we match with \s to be certain to include unicode spaces
	s = s.trim()
	s = s.replace(/ /g, '-')//avoid %20

	s = s.replace(/([-._~]{3,})/g, match => match.slice(0, 2))//allow groups of punctuation, but no longer than 2
	s = s.replace(/\.{2,}/g, '.')//allow periods, but not 2 or more together

	s = s.slice(0, nameLength)
	s = s.replace(/^[^A-Za-z_]+|[^A-Za-z0-9_]+$/g, '')//must start Az_ but can end Az09_
	return s
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

export function checkName(s) {//already validated text as a user's normalized route
	let v = validateName(s)
	if (!v.isValid)        toss('not valid',           {s, v})
	if (v.formNormal != s) toss('round trip mismatch', {s, v})
}
/*
^ttd february, so, do you need this? next make the choose/change your user name and route form to figure that out
wait--should checkRoute, for instance, also validate that as given, it doesn't change to normal?!
yes, it should--both check that the given text can be made valid and normal, and that the given text is alerady valid and normal
add that check to the other checkSomething editions
*/

const nameLength = 42//maximum length, super sized from twitter 15, 20 reddit, 30 gmail, and 32 tumblr
export function validateName(raw) {//raw text from either the first (page) or second (link/route) boxes in the choose or change your user name form
	let formPage = trim(raw)//"東京❤️女の子" valid for display on the page
	let formFormal = slug(raw)//"Tokyo-Girl" working and correct route for links
	let formNormal = formFormal.toLowerCase()//"tokyo-girl" reserved to prevent duplicates, also a working route
	let isValid = (
		hasText(formPage)   && formPage.length   <= nameLength &&
		hasText(formFormal) && formFormal.length <= nameLength &&
		hasText(formNormal) && formNormal.length <= nameLength
	)
	return {isValid, formNormal, formFormal, formPage, raw}

	//ttd february, slug truncates to 42, but you need to add that here for maximum name length for page, also
}

//  _   _ _   _                        _                   _   
// | |_(_) |_| | ___    __ _ _ __   __| |  _ __   ___  ___| |_ 
// | __| | __| |/ _ \  / _` | '_ \ / _` | | '_ \ / _ \/ __| __|
// | |_| | |_| |  __/ | (_| | | | | (_| | | |_) | (_) \__ \ |_ 
//  \__|_|\__|_|\___|  \__,_|_| |_|\__,_| | .__/ \___/|___/\__|
//                                        |_|                  

const titleLength = 128
export function validateTitle(raw) {
	let formNormal = trim(raw)
	if (!hasText(formNormal) || formNormal.length > titleLength) return {formNormal, raw}
	return {isValid: true, formNormal, raw}
}

const postLength = 2*Size.kb
export function validatePost(raw) {//returns an array of paragraphs
	let a = lines(raw)
	if (!a.length) return {raw}
	//ttd february
	return {isValid: true, formNormal: a, raw}
}
//ttd february, you need to add maximum length truncation and checks to these. actually set limits in the page, and enforce them here--if somehow text makes it down that's over that limit, you don't have to truncate, just isValid false













//earlier draft and thinking and attempt:
//for use in the form, while typing, says if valid and suggests
export function typeUserName({pageRaw, routeRaw}) {//if they changed pageRaw, omit routeRaw; if they typed routeRaw, include both
	let pageName = pageRaw
	let routeName = routeRaw
	let lookName = routeName.toLowerCase()
	return {
		isValid: true,
		hint: 'type something',
		pageName,
		routeName,
		lookName,
	}
}
//for use on both sides of fetch, throws on a problem
export function checkUserName({pageName, routeName, lookName}) {
	if (!routeName) routeName = lookName; if (!pageName) pageName = routeName//earlier are optional
	/*
	lots to do here later, like
	pageName can't have double spaces or start or end with spaces--condensed must be the same as given
	routeName lowercased must be lookName
	those routes can have only letters, numbers, and -_.
	but also can't have any of -_. next to one another
	*/
	//minimal check for today's need:
	checkText(lookName)
}
//const nameLength = 42//we support the longest names in the business, yessiree!
export function checkUserRoute(s) { if (!validUserRoute(s)) toss('check', {s}) }
export function validUserRoute(s) {//check route text s, like "name-a"
	return (
		typeof s == 'string' && s.length >= 1 &&//string that's not blank
		s.length <= nameLength &&//nor too long
		/^[a-z0-9._-]+$/.test(s) &&//only lowercase letters, numbers, and ._- allowed
		!(/[._-]{2}/.test(s))//but those three allowed characters can't appear together!
		//ttd january, maybe also can't have a period at the start or the end
		//and research what current popular platforms do--you haven't done enough research for this to design it properly
	)
}
test(() => {
	ok(validUserRoute('a'))
	ok(!validUserRoute('A'))
	ok(validUserRoute('user-a'))
	ok(!validUserRoute('user a'))
	ok(validUserRoute('_some.name_'))
	ok(!validUserRoute('some..name'))
	ok(!validUserRoute('some.-name'))
})









































































































export function liveBox(s) {
	return
	let date = validateDate(s)
	let age
	if (date.isValid) age = ageDate(s, 60, Now())
	return {date, age}
}




























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
export function checkEmail(raw) { let v = validateEmail(raw); if (!v.isValid) toss('form', {v}); return v }
export function validateEmail(raw) {

	/* (1) adjusted step for email
	trim space before and after
	don't touch space in the middle
	*/
	let formFormal = raw.trim()
	let j1 = _email.validate(formFormal)
	if (j1.error) return {formFormal, raw, j1}//isValid not true on these early returns

	/* (2) presented step for email
	leave the name the same, but lowercase the domain
	BOBSMITH@SPINDEX.BIZ clearly has his caps lock on, but maybe his email only works if you shout at him
	TomStoppard@SpeedOfArt.net is used to seeing his domain flattened
	*/
	let p = cut(formFormal, "@")
	let formPage = p.before + "@" + p.after.toLowerCase()
	let j2 = _email.validate(formPage)
	if (j2.error) return {formFormal, formPage, raw, j2}

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
	if (j3.error) return {formFormal, formPage, formNormal, raw, j3}

	return {isValid: true, formNormal, formFormal, formPage, raw}
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

//             _ _     _       _               _                      
// __   ____ _| (_) __| | __ _| |_ ___   _ __ | |__   ___  _ __   ___ 
// \ \ / / _` | | |/ _` |/ _` | __/ _ \ | '_ \| '_ \ / _ \| '_ \ / _ \
//  \ V / (_| | | | (_| | (_| | ||  __/ | |_) | | | | (_) | | | |  __/
//   \_/ \__,_|_|_|\__,_|\__,_|\__\___| | .__/|_| |_|\___/|_| |_|\___|
//                                      |_|                           

export function checkPhone(raw) { let v = validatePhone(raw); if (!v.isValid) toss('form', {v}); return v }
export function validatePhone(raw) {
	let numerals = onlyNumerals(raw)
	let assumedRegion//leave undefined if not US
	if (numerals.length == 10 ||//assume all 10 digit numbers are US
		(numerals.length == 11 && starts(numerals, '1')))//or they also typed the 1 at the start
		assumedRegion = 'US'

	let phone = parsePhoneNumberFromString(raw, assumedRegion)
	if (!phone || !phone.isValid()) return {raw, assumedRegion, phone}

	let formNormal = phone.format('E.164')//as established by the International Telecommunication Union
	let formFormal = formNormal//use E.164 with APIs, also
	let formPage = phone.formatInternational()//prettier, with spaces, for the user to see on the page
	if (!hasText(formNormal) || !hasText(formPage)) return {formNormal, formFormal, formPage, raw, assumedRegion, phone}

	return {isValid: true, formNormal, formFormal, formPage, raw, assumedRegion, phone}
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
export function validateCard(raw) {

	/* (1) adjusted step for credit card number
	just numerals, removing spaces, dots, dashes
	/* (2) this is the normalized form
	*/
	let formNormal = onlyNumerals(raw)

	/* (3) intermediate step for a number the user hasn't finished typing yet
	use braintree's credit-card-type module to get the type
	this module also tells you how to group the numerals
	*/
	let cardType = creditCardType(formNormal)//from npm credit-card-type
	if (!cardType.length) return {formNormal, raw, cardType, note: 'no type'}//cardType should be an array of at least one possible type
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
	if (onlyNumerals(formPage) != formNormal) return {formNormal, formPage, raw, cardType, note: 'round trip mismatch'}

	/* (4) use joi to validate at the end
	*/
	let j1 = _card.validate(formNormal)//Joi will do the Luhn check, which credit-card-type can't do, so that's why we use both
	if (j1.error) return {formNormal, formPage, raw, cardType, j1}

	return {isValid: true, formNormal, formPage, raw, cardType}//also return the detected type information
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

export const months = ['',//Jan at index 1, Dec at 12
	'Jan', 'Feb', 'Mar', 'Apr',
	'May', 'Jun', 'Jul', 'Aug',
	'Sep', 'Oct', 'Nov', 'Dec']
export function checkDate(raw) { let v = validateDate(raw); if (!v.isValid) toss('form', {v}); return v }
export function validateDate(raw) {
	let adjusted = onlyNumerals(raw)
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
		formPage: `${year}-${months[month]}-${day}`,//form to show to the user on the page
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


















//move these new say functions to level0, as they are general use and import nothing
//move thinSpace into this section, also

//say a huge integer like "802 billion"
const _magnitudes = ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion', ' decillion']
function sayHugeInteger(i) {
	let b = big(i)
	let u = 0
	while (b >= 1000n && u < _magnitudes.length - 1) {
		b /= 1000n
		u++
	}
	return `${sayGroupDigits(b+'')}${_magnitudes[u]} year${sayPlural(i)}`
}

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
	if (!thousandsSeparator) thousandsSeparator = thinSpace
	let minus = ''
	if (s.startsWith('-')) { minus = '-'; s = s.slice(1) }//deal with negative numbers
	if (s.length > 4) {//let a group of four through
		s = s.split('').reverse().join('')//reversed
		s = s.match(/.{1,3}/g).join(thousandsSeparator)//grouped reverse
		s = s.split('').reverse().join('')//forward again
	}
	return minus+s
}













/*
deindent
the first line will be blank
the second line, the whitespace that starts it, must be removed from later lines
actually just remove tabs, spaces after tabs stay, spaces stay
later lines, that number of spaces, remove them
the last line will be just whitespace, omit it
*/
















/*
here's a good first pinia task, maybe
have log output that shows in /log, and any page, as you click around, can add to
*/






export function checkAction(action, list) {
	checkText(action)
	if (!/^[A-Z]/.test(action)) toss('form', {action, list})
	if (!/\.$/.test(action))    toss('form', {action, list})
	if (!list.includes(action)) toss('action not supported', {action, list})
}
test(() => {
	checkAction('Do.', ['Do.', 'Some.', 'Thing.'])
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















































