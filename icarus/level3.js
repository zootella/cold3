
import {
wrapper,
} from './wrapper.js'
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
textToInt, hasText, checkText, checkTextOrBlank, newline, deindent, stringo,
Data, decrypt, hashData, secureSameText,
replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
hmacSign,
checkHash, checkInt, roundDown, hashText, given,
randomCode, hashToLetter,
} from './level0.js'
import {
Tag, Limit, checkTag, checkTagOrBlank, checkName, validateName,
bundleValid,
} from './level1.js'
import {
getAccess, Sticker, isLocal, isCloud,

/* level 2 query */

//query snippet
snippetClear, snippetPopulate, snippetQuery2, snippet2,
queryCountRows, queryCountAllRows, queryDeleteAllRows,

//query common
queryTop,
queryGet,
queryGet2,
queryAddRow,
queryAddRows,
queryHideRows,
queryUpdateCells,

//query specialized
queryCountSince,
queryAddRowIfHashUnique,
queryTopEqualGreater,
queryTopSinceMatchGreater,

} from './level2.js'

//level3 ~ welcome to the level of business logic






















//ttd march, quick new one
export async function fetch23({$fetch, path, body}) {//pass in $fetch, where you call this Nuxt defines it, ttd march can we get this from door or a global or something instead?
	let host = urlNetwork23()
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	body.ACCESS_NETWORK_23_SECRET = (await getAccess()).get('ACCESS_NETWORK_23_SECRET')//don't forget your keycard
	body.warm = true;  let resultWarm   = await $fetch(host+path, {method: 'POST', body})
	body.warm = false; let resultAction = await $fetch(host+path, {method: 'POST', body})
	return resultAction
}




/*
ttd december, figure out how bridge works now that you've got cors done
write something small and simple which ping4 and test can use, too; right now they're doing this
and, importantly, because you're building security upon it:
[]replace Sticker().isCloud with something that isn't based on fuzzy logic!

to begin--don't do the warm thing, either--the errors you were seeing were only for GET, not POST
well, now you sort of want to do it
*/

/*
ttd march
you don't need forceCloudLambda anymore, you never used it
use {} for named arguments, of course
yeah do the warmup
*/

//  _          _     _              _                     _   ____  _____ 
// | |__  _ __(_) __| | __ _  ___  | |_ ___    _ __   ___| |_|___ \|___ / 
// | '_ \| '__| |/ _` |/ _` |/ _ \ | __/ _ \  | '_ \ / _ \ __| __) | |_ \ 
// | |_) | |  | | (_| | (_| |  __/ | || (_) | | | | |  __/ |_ / __/ ___) |
// |_.__/|_|  |_|\__,_|\__, |\___|  \__\___/  |_| |_|\___|\__|_____|____/ 
//                     |___/                                              

/*
forceCloudLambda false means local worker -> local lambda; cloud worker -> cloud lambda
forceCloudLambda true  means local worker -> cloud lambda; cloud worker -> cloud lambda
either way a cloud worker always calls to a cloud lambda, because callign down wouldn't work at all
*/
const _forceCloudLambda = false
const resourceLocalNetwork23 = 'http://localhost:4000/prod'//check your local Network 23 affliate
const resourceCloudNetwork23 = 'https://api.net23.cc'//or our global connectivity via satellite
export function urlNetwork23(forceCloudLambda) {//where you can find Network 23; no trailing slash
	return (forceCloudLambda || isCloud({uncertain: 'Cloud.'})) ? resourceCloudNetwork23 : resourceLocalNetwork23
}
export async function fetchNetwork23(nuxtDollarFetchFunction, providerDotService, path, body) {//pass in $fetch which nuxt has imported in site/server/api/caller.js but not here in icarus

	/*
	warm is the module that the lambda will use, like "AE" for amazon email
	if warm is set, then do a first warmup call, right here, before doing teh real call
	so callers of fetchNetwork23 get that warmup service for free, and don't have to think about it
	*/
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	let access = await getAccess()
	let host = urlNetwork23(_forceCloudLambda)
	body.ACCESS_NETWORK_23_SECRET = access.get('ACCESS_NETWORK_23_SECRET')//don't forget your keycard

	let d = Duration()
	body.warm = true
	let resultWarm = await nuxtDollarFetchFunction(host+path, {method: 'POST', body})

	body.warm = false
	let resultAction = await nuxtDollarFetchFunction(host+path, {method: 'POST', body})
	d.finish()//but then log this or return this or something, right now you're just trying out your new Duration object
	return resultAction
	//ttd march, you like the warmup, but probably you don't need the "what we are warming up", just call warm to the lambda, and either that will warm up everything, or that can warm up everything, or that will not warm up everything but get things starting to get warm, which is all you need

	/*
	november
	[]retry if first one fails, but only once
	[]record the entire duration so you can see how long the whole two punch thing takes
	*/
}
/*
since adding sharp to lambdas, you've seen reliability problems!
like a 500 internal server error that is corrected by hitting refresh in the browser
and, the cold start is apparent now--a first hit in the morning takes seconds, then after that it's fast
so make this bridge first hit a wakup endpoint, and then do the real request
this simple stateless workaround won't slow things down much and is way easier than trying to clean up a failed request will preventing duplicate stateful real world action, like sending the user two text messages instead of one

ok, the flow is
1 do warm call
2 if failed, do warm call again
3 do real call

and log alerts when second warm call fails, meaning you don't try
or second warm call succeeds, meaning you fixed it but that was weird

but also--you've only seen these reliability problems on GET lambdas, never POST
you still like calling into a warm lambda, and the code isn't too hard, though
*/

//move to level0
function Duration(givenOpenTick) {//a small object to keep tick counts together for durations

	let _openTick, _shutTick, _duration
	function openTick() { return _openTick }//accessors
	function shutTick() { return _shutTick }
	function duration() { return _duration }

	_openTick = givenOpenTick ? givenOpenTick : Now()//use the given start time, or right now

	function finish() {//call a little later when whatever you're timing has finished
		_shutTick = Now()
		_duration = _shutTick - _openTick
	}
	return {openTick, shutTick, duration, finish}
}
//if you do this, have it keep an array with any number of durations, and then a .text() which summarizes gaps on one line









//  _                                       _              
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _  __ _ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` |/ _` |
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | (_| |
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|\__, |
//                                                   |___/ 
/*
to keep the user signed in without expiration,
and to identify a user even before they've signed up,
we save a tag in the browser's local storage

to prevent a user from revealing their tag,
even if a n00b user is being coached by a hacker on reddit or discard to dig around the inspector,
we use a frighteningly worded key name and value prefix

getBrowserTag() creates and sets if not found, as though it was already there
if something is malforming the tag or preventing it from being saved, getBrowserTag() returns a new tag every time
if there's no localStorage, getBrowserTag() will throw an exception
*/
const browserTagName = 'current_session_password'
const browserTagValuePrefix = 'account_access_code_DO_NOT_SHARE_'
export function getBrowserTag() {//use from a comonent's onMounted to be sure local storage is there
	let v = localStorage.getItem(browserTagName)
	if (
		hasText(v) &&
		v.length == browserTagValuePrefix.length+Limit.tag &&
		v.startsWith(browserTagValuePrefix)) {//read and return

		return v.slice(-Limit.tag)

	} else {//make and return

		let tag = Tag()
		localStorage.setItem(browserTagName, browserTagValuePrefix+tag)
		return tag//return the tag we just made, and tried to set for next time
	}
}






//        _         
// __   _| |__  ___ 
// \ \ / / '_ \/ __|
//  \ V /| | | \__ \
//   \_/ |_| |_|___/
//                  
/*
make the query string for a signed link to a path within vhs.net23.cc the bearer can use for read access
path is like "/folder1/folder2/" with slashes on both ends, granting access to folders and files within
expiration is a number of milliseconds, like 2*Time.hour, granting access for that long
uses the time now, generates a new random unique tag, and uses the shared vhs secret
returns query string parameters like:

path=%2Ffolder1%2Ffolder2%2F&tick=1733785941120&seed=gh9U49hZ2Cdp0osLFdFL4&hash=NYAIl8bGpoY0PQx4Eq5p8
Gb%2BabT%2FX%2FOx0Edh3ifBJ7g%3D

note the uri encoding that turns / into %2F and = into %3D; path and hash can have characters that need to be encoded
*/
export async function vhsSign(path, expiration) {
	let access = await getAccess()//this uses access, the current time, and a new random tag, so it's difficult to test
	return await _vhsSign(Data({base16: access.get('ACCESS_VHS_SECRET')}), path, Now(), expiration, Tag())
}
async function _vhsSign(secret, path, now, expiration, seed) {//so we've factored out this core for testing, below
	let message = `path=${encodeURIComponent(path)}&tick=${now+expiration}&seed=${seed}`
	let hash = await hmacSign(secret, message)
	let query = `${message}&hash=${encodeURIComponent(hash.base64())}`
	return query
}
test(async () => {
	let secret = Data({base16: '8d64b043e91a4e08e492ae37b8ac96bdb89877865b9dbcbe7789766216854f90'})//example test secret
	ok(secret.size() == 32)
	let path = '/folder1/folder2/'
	let now = 1733858021895
	let expiration = 2*Time.hour
	let seed = 'LsX2IlDdSRQ5ioFccXBOL'
	ok(await _vhsSign(secret, path, now, expiration, seed) == 'path=%2Ffolder1%2Ffolder2%2F&tick=1733865221895&seed=LsX2IlDdSRQ5ioFccXBOL&hash=tZt6CmoGaTrPCQeIpAfwmhKUn4rfpCpS9AmMx4GY2Js%3D')
})










//   __                      
//  / _| ___  _ __ _ __ ___  
// | |_ / _ \| '__| '_ ` _ \ 
// |  _| (_) | |  | | | | | |
// |_|  \___/|_|  |_| |_| |_|
//                           

export function validateMessageForm() {

}
//ttd february--so the idea here is, then for a form, you bundle the verification of multiple fields into a single object. does that work with different steps? this is just a sketch at this point, but you like the concept of getting standard "whole form is good to go" logic in one place, for client and server, rather than in Vue handlers above. (you really like that idea) as well as having a standard .isValid for a whole form, rather than just a bunch of individual form field valid flags




























//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

const SQL = noop//keeping the schema alongside the code; run by copypastaing on the supabase dashboard
SQL(`
-- list all the tables, and all the indices
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC;
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname ASC;

-- see what columns a table has, and what their type is
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'example_table';

-- more information about how a table is set up in the schema
SELECT c.ordinal_position, c.column_name, c.data_type, c.is_nullable, c.column_default, c.character_maximum_length, tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu ON c.table_schema = kcu.table_schema AND c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_schema = tc.constraint_schema AND kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public' AND c.table_name = 'example_table'
ORDER BY c.ordinal_position;

-- see what indices a table has, and delete one
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'example_table' ORDER BY indexname ASC;
DROP INDEX IF EXISTS index1;

-- rename a table, column, and index
ALTER TABLE example_table RENAME TO renamed_table;
ALTER TABLE example_table RENAME COLUMN title1 TO title2;
ALTER INDEX index1 RENAME TO index2;
`)

export async function snippetQuery3() {
	let data, error
	try { data = await snippet3() } catch (e) { error = e }
	if (error) return look(error)
	else return data
}
export async function snippet3() {
	log("hi from snippet 3")
}

//            _     _                     _        _     _      
//   __ _  __| | __| |_ __ ___  ___ ___  | |_ __ _| |__ | | ___ 
//  / _` |/ _` |/ _` | '__/ _ \/ __/ __| | __/ _` | '_ \| |/ _ \
// | (_| | (_| | (_| | | |  __/\__ \__ \ | || (_| | |_) | |  __/
//  \__,_|\__,_|\__,_|_|  \___||___/___/  \__\__,_|_.__/|_|\___|
//                                                              

//--this user mentioned, or proved they can read messages sent to, this address
//address_table, ttd february

/*
simplest question to answer: is this address
proven owned and controlled by an existing user
not (maybe totally new, maybe mentioned but not validated yet)

*/


SQL(`
-- has a user proven they control an address?
CREATE TABLE address_table (
	row_tag      CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick     BIGINT    NOT NULL,
	hide         BIGINT    NOT NULL,

	user_tag     CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed an address

	type_text    TEXT      NOT NULL,  -- what type of address this is, like "Email." or "Phone."
	normal_text  TEXT      NOT NULL,  -- normalized form of address, to match as unique
	formal_text  TEXT      NOT NULL,  -- formal form of address, to send messages
	page_text    TEXT      NOT NULL,  -- page form of address, to show the user

	event        BIGINT    NOT NULL   -- 2 mentioned, 3 challenged, 4 validated, 1 removed
);

CREATE INDEX address1 ON address_table (hide, user_tag,               row_tick DESC);  -- filter by user
CREATE INDEX address2 ON address_table (hide, type_text, normal_text, row_tick DESC);  -- or by address
`)

export async function addressRemoved({userTag, type, v})    { await address_add({userTag, type, v, event: 1}) }
export async function addressMentioned({userTag, type, v})  { await address_add({userTag, type, v, event: 2}) }
export async function addressChallenged({userTag, type, v}) { await address_add({userTag, type, v, event: 3}) }
export async function addressValidated({userTag, type, v})  { await address_add({userTag, type, v, event: 4}) }
async function address_add({userTag, type, v, event}) {//v is the result of a validate function, containing the three forms
	await queryAddRow({table: 'address_table', row: {
		user_tag: userTag,
		type_text: type,
		normal_text: v.formNormal, formal_text: v.formFormal, page_text: v.fromPage,
		event: event,
	}})
}
/*
addressToUser - given an address, get the user who we've challenged it for, or validated, and has not removed it
so returns a user tag and ownership level 3 or 4, or falsey if the address is available

userToAddresses - given a user, get the addresses we've challenged and validated, that have not been removed
so returns an array of addresses, different types, events collapsed to be most recent 3 or 4
*/


export async function addressToUser({type, formNormal}) {
	//the query you need is all rows that are visible that match those two cells
	/*
	let's say we query all the rows about that address, it's type and normalized form
	what does code here need to do to process that further?

	looking for 3 or 4 that does not have more recent 1

	if there's a 1, knock thta out and all earlier records
	then look for a 4
	if not thta then a 3

	return {userTag, event 3 or 4}, or false

	like the most recent
	*/


	//returns user tag, or falsey if that address is not in validated ownership by anyone
}
export async function userToAddress({userTag}) {
	//here, we return all the addresses that a user has validated, of all types


}
//see if you can code the simplest happy paths with these two, you can always add more later


/*
get

does anyone control this address? falsey or user tag
what addresses does this user control?


are we hiding rows here? maybe for this one, which is lower churn than signing in, we dont


*/






/*
ttd march
adding domain_text to browser_table
browser_tag is from local storage
and local storage is specific to the device, browser, chrome profile, and host name
so already you have different local storage for localhost as opposed to cold3.cc
and that's fine, and you do want browser_table to have a record of what host this browser tag cam from the local storage of


Exactly! Local storage is scoped specifically to the protocol, port, subdomain, and domain.
*/


//  _                                       _        _     _      
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | |_) | |  __/
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|_.__/|_|\___|
//                                                                

SQL(`
-- what user is signed into this browser? sign users in and out
CREATE TABLE browser_table (
	row_tag      CHAR(21)  NOT NULL PRIMARY KEY,  -- unique tag identifies each row
	row_tick     BIGINT    NOT NULL,  -- tick when row was added
	hide         BIGINT    NOT NULL,  -- 0 visible, nonzero ignore

	browser_tag  CHAR(21)  NOT NULL,  -- the browser a request is from
	user_tag     CHAR(21)  NOT NULL,  -- the user we've proven is using that browser
	level        BIGINT    NOT NULL   -- 0 signed out, 1 provisional, 2 normal, 3 super user hour

	origin_text  TEXT      NOT NULL,  -- the protocol, port, subdomain, and domain for the the local storage holding browser tag
);

-- index to get visible rows about a browser, recent first, quickly
CREATE INDEX browser1 ON browser_table (hide, browser_tag, row_tick DESC);  -- filter by browser
CREATE INDEX browser2 ON browser_table (hide, user_tag,    row_tick DESC);  -- or by user
CREATE INDEX browser3 ON browser_table (hide, level,       row_tick DESC);  -- quickly find expired super user hours
`)
//ttd february, trying the pattern where the group of functions which exclusively touch the table are named example_someThing, as below. if it works well for browser and name tables, then look at expanding to everywhere

async function browser_get({browserTag}) {//what user, if any, is signed in at this browser?
	checkTag(browserTag)
	let row = await queryTopEqualGreater({
		table: 'browser_table',
		title1: 'browser_tag', cell1: browserTag,
		title2: 'level', cell2GreaterThan: 0,
	})
	return row ? {browserTag: row.browser_tag, userTag: row.user_tag, level: row.level, origin: row.origin_text} : false
}
async function browser_in({browserTag, userTag, level, origin}) {//this user has proven their identity, sign them in here
	checkTag(browserTag); checkTag(userTag); checkInt(level, 1); checkText(origin)//make sure level is 1+
	await queryAddRow({
		table: 'browser_table',
		row: {
			browser_tag: browserTag,
			user_tag: userTag,
			level,//sign in at level 1 provisional, 2 normal, or 3 start an hour of elevated permissions
			origin_text: origin,
		}
	})
}
async function browser_out({browserTag, userTag, hideSet, origin}) {//sign this user out everywhere; browser tag included but doesn't matter; hide reason code is optional for a note different than default 1
	checkTag(browserTag); checkTag(userTag); checkText(origin)
	await queryAddRow({//record that this user's sign-out happened now, and from this browser
		table: 'browser_table',
		row: {
			browser_tag: browserTag,
			user_tag: userTag,
			level: 0,//level 0 means this row is about the user signing out
			origin_text: origin,
		}
	})
	await queryHideRows({table: 'browser_table', titleFind: 'user_tag', cellFind: userTag, hideSet})//hide all the rows about this user, including the one we just made, signing them out, everywhere
}



































//functions in the code system call these handlers to report that the person at browser tag challenged an address, and we sent a code there, and, possibly, later, entered the correct code, validating that address
export async function browserChallengedAddress({browserTag, provider, type, v}) {
	//address_table
	//service_table
}
export async function browserValidatedAddress({browserTag, provider, type, v}) {
	//address_table
	//service_table
	/*
	so in here is where we do things like:
	sign the user up
	sign the user in
	record that the user validated the address in address_
	record in service_table that the api succeeded, too
	*/
}

//~~~~ send all the codes!

export async function codeSend({browserTag, provider, type, v}) {//v is the address, valid, containing the three forms

	//look up the user tag, even though we're not using it with code yet
	let userTag = (await demonstrationSignGet({browserTag}))?.userTag

	let permit = await codePermit({v})
	if (!permit.isPermitted) {
		return permit//change to api response, not permit response
	}

	let code = await codeCompose({length: permit.useLength, sticker: true})

	let body = {
		provider: provider,
		service: type,
		address: v.formFormal,
		subjectText: code.subjectText,//email subject
		messageText: code.messageText,//email body as text, or complete SMS message
		messageHtml: code.messageHtml,//email body as HTML
	}
	let net23 = await fetch23({$fetch, path: '/message', body})//ttd march, other notes about getting the nuxt environment reference $fetch
	//log(look({net23}))
	//does this throw if it's not successful? does it return a note in the return object?

	await codeSent({browserTag, provider, type, v, permit, code})
}

//can we send another code to this address now?
async function codePermit({v}) {
	const now = Now()

	//use the code table to find out how many codes we've sent address
	let rows = await code_get_address({addressNormal: v.formNormal})//get all the rows about the given address
	let days5 = rows.filter(row => row.row_tick >= now - Code.days5)//those over the past 5 days
	let days1 = days5.filter(row => row.row_tick >= now - Code.days1)//those in just the last 24 hours
	let minutes20 = days1.filter(row => row.row_tick >= now - Code.lifespan20)//past 20 minutes, so could be active still

	if (days1.length >= Code.quantity10) {//we've already sent 10 codes to this address in the last 24 hours!
		return {
			isPermitted: false,
			explanation: 'We can only send 10 codes in 24 hours.',
			whenCanSend: days1[days1.length - 1].row_tick + Code.days1,//when the earliest will receed over the horizon
		}
	}

	if (days5.length >= Code.quantity2) {//we've sent 2+ codes to this address in the last 5 days
		let cool = days5[0].row_tick + Code.minutes5//tick when this address cooled down
		if (now < cool) {//hasn't happened yet
			return {
				isPermitted: false,
				explanation: 'Must wait 5 minutes between codes.',
				whenCanSend: cool,
			}
		}
	}

	return {
		isPermitted: true,
		useLength: days5.length < Code.quantity2 ? Code.length4 : Code.length6,
		aliveCodeTag: (minutes20.length && minutes20[0].lives) ? minutes20[0].row_tag : false,//include the code tag of a code that we sent to this address less than 20 minutes ago, and could still be verified. if you send a replacement code, you have to kill this one
	}
}

//make a new random code and compose message text about it
async function codeCompose({length, sticker}) {
	let c = {}

	c.codeTag = Tag()
	c.letter = await hashToLetter(c.codeTag, Code.alphabet)
	c.code = randomCode(length)
	c.hash = await hashText(c.codeTag+c.code)

	c.subjectText = `Code ${c.letter} ${c.code} for ${(await getAccess()).get('ACCESS_MESSAGE_BRAND')}`
	const warning = ` - Don't tell anyone, they could steal your whole account!`
	sticker = sticker ? 'STICKER' : ''//gets replaced by the sticker on the lambda

	c.messageText = `${c.subjectText}${warning}${sticker}`
	c.messageHtml = `<html><body><p style="font-size:24px; font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="color:#ff00ff;">${c.subjectText}</span><span style="color:#808080;">${warning}${sticker}</span></p></body></html>`
	return c
}

//what it looks like to use these functions to send a code
async function codeSent({browserTag, provider, type, v, permit, code}) {

	if (permit.aliveCodeTag) {
		await code_set_lives({codeTag: permit.aliveCodeTag, lives: 0})//invalidate the code this new one will replace
	}

	//take care of address_table and maybe also service_table
	await browserChallengedAddress({browserTag, provider, type, v})

	//record that we sent the new code
	await code_add({codeTag: code.codeTag, browserTag, provider, type, v, hash: code.hash, lives: Code.guesses4})
}

//is this browser expecting any codes? needs to run fast!
export async function codeLiveForBrowser({browserTag}) {
	let rows = await queryTopSinceMatchGreater({table: 'code_table',
		since: Now() - Code.lifespan20,//get not yet expired codes
		title1: 'browser_tag', cell1: browserTag,//for this browser
		title2: 'lives', cell2GreaterThan: 0,//that haven't been guessed to death or otherwise revoked
	})
	let codes = []
	if (rows) {
		for (let row of rows) {
			codes.push({
				//prepare records that the page will keep in a List
				tag: row.row_tag,//the code's tag, also the row tag, letting the page identify the challenge
				tick: row.row_tick,//when we sent the code

				letter: await hashToLetter(row.row_tag, Code.alphabet),//the page could derive this but we'll do it
				addressType: row.type_text,//the type of address, like "Email."
				addressPage: row.page_text,//the address in the form to show on the page
				//note we importantly do not send hash to the page, that's the secret part!

				duration: row.row_tick + Code.lifespan20 - Now(),//how much longer the user has to guess
				lives: row.lives,//how many guesses remain on this code

				//ttd april, not sure about these, state for the page
				correct: false,//the page will set this true in pinia when the user guesses correctly
				show: true,//the page will set true once the user Xed out of the box about this
			})
		}
	}
	return codes//return empty if no codes for this browser right now
}

//the person at browserTag used the box on the page to enter a code, which could be right or wrong
export async function codeEnter({browserTag, codeTag, codeEntered}) {
	let now = Now()

	//find the row about it
	let row = await code_get({codeTag})
	if (!row || row.browser_tag != browserTag || !row.lives) return {correct: false, lives: 0}//these would be very unusual, like from a tampered-with page

	//too late, return lives 0 to tell the page the user needs to request a new code
	if (row.row_tick + Code.lifespan20 < now) return {correct: false, lives: 0}

	//correct guess
	if (secureSameText(row.hash, await hashText(codeTag+codeEntered))) {

		await code_set_lives({codeTag, lives: 0})//a correct guess also kills the code
		await browserValidatedAddress({
			browserTag,
			provider: row.provider_text,
			type: row.type_text,
			addressNormal: row.normal_text, addressFormal: row.formal_text, addressPage: row.page_text,
		})
		return {correct: true, lives: 0}

	//wrong guess
	} else {

		let lives = row.lives - 1
		await code_set_lives({codeTag, lives})
		return {correct: false, lives: lives}//user may be able to guess again
	}
}










//                _        _        _     _      
//   ___ ___   __| | ___  | |_ __ _| |__ | | ___ 
//  / __/ _ \ / _` |/ _ \ | __/ _` | '_ \| |/ _ \
// | (_| (_) | (_| |  __/ | || (_| | |_) | |  __/
//  \___\___/ \__,_|\___|  \__\__,_|_.__/|_|\___|
//                                               

export const Code = {//factory settings for address verification codes

	//for each code
	lifespan20: 20*Time.minute,//dead in 20 minutes
	guesses4:   4,             //dead after 4 wrong guesses
	//also, dead after issued replacement

	//for each address
	quantity10: 10,      //limit 10 codes,
	days1:      Time.day,//in 24 hours.

	quantity2: 2,            //first 2 codes in,
	days5:     5*Time.day,   //5 days we can issue back to back, then,
	minutes5:  5*Time.minute,//5 minute delay between sending codes to an address.

	length4: 4,//first 2 codes in 5 days to an address can be short like "1234"
	length6: 6,//after that, longer like "123456"

	//derived from code tag
	alphabet: 'ABCDEFHJKMNPQRTUVWXYZ',//21 letters that don't look like numbers, omitting gG~9, iI~1, lL~1, oO~0, sS~5
}
Object.freeze(Code)

SQL(`
-- what code like 1234 have we sent to a user to verify their address?
CREATE TABLE code_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,  -- uniquely identifies the row, and also used as the code tag
	row_tick       BIGINT    NOT NULL,  -- when we sent the code, the start of the code's 20 minute lifetime
	hide           BIGINT    NOT NULL,  -- not used, instead set lives to 0 below to revoke the code

	browser_tag    CHAR(21)  NOT NULL,  -- the browser that entered, and must verify, the address

	provider_text  TEXT      NOT NULL,  -- note we sent the code using "Amazon." or "Twilio."
	type_text      TEXT      NOT NULL,  -- address type like "Email." or "Phone."
	normal_text    TEXT      NOT NULL,  -- address in the three forms, we'll use normal to find and page to show
	formal_text    TEXT      NOT NULL,
	page_text      TEXT      NOT NULL,

	hash           CHAR(52)  NOT NULL,  -- the hash of the code tag followed by the 4 or 6 numeral code

	lives          BIGINT    NOT NULL   -- starts 4 guesses, decrement, or set directly to 0 to invalidate
);

CREATE INDEX code1 ON code_table (browser_tag,            row_tick DESC) WHERE hide = 0;  -- filter by user
CREATE INDEX code2 ON code_table (type_text, normal_text, row_tick DESC) WHERE hide = 0;  -- or by address
^ttd march, maybe, change all indices to partial with where hide zero like above
`)

async function code_get({codeTag}) {//get the row about a code
	let rows = await queryGet({table: 'code_table', title: 'row_tag', cell: codeTag})
	return rows.length ? rows[0] : false
}
async function code_get_browser({browserTag}) {//get all the rows about the given browser
	return await queryGet({table: 'code_table', title: 'browser_tag', cell: browserTag})
}
async function code_get_address({addressNormal}) {//get all the rows about the given address
	return await queryGet({table: 'code_table', title: 'normal_text', cell: addressNormal})
}

async function code_set_lives({codeTag, lives}) {//set the number of lives, decrement on wrong guess or 0 to revoke
	await queryUpdateCells({table: 'code_table',
		titleFind: 'row_tag', cellFind: codeTag,
		titleSet:  'lives',   cellSet: lives,
	})
}
async function code_add({codeTag, browserTag, provider, type, v, hash, lives}) {//make a record to send a new code
	await queryAddRow({table: 'code_table', row: {
		row_tag: codeTag,//unique, identifies row and code, so chosen earlier to save a copy
		browser_tag: browserTag,
		provider_text: provider,
		type_text: type,
		normal_text: v.formNormal, formal_text: v.formFormal, page_text: v.formPage,
		hash,
		lives,
	}})
}













//                                 _        _        _     _      
//   _____  ____ _ _ __ ___  _ __ | | ___  | |_ __ _| |__ | | ___ 
//  / _ \ \/ / _` | '_ ` _ \| '_ \| |/ _ \ | __/ _` | '_ \| |/ _ \
// |  __/>  < (_| | | | | | | |_) | |  __/ | || (_| | |_) | |  __/
//  \___/_/\_\__,_|_| |_| |_| .__/|_|\___|  \__\__,_|_.__/|_|\___|
//                          |_|                                   

//use for practice

SQL(`
-- example table for demonstration, practice, and testing
CREATE TABLE example_table (
	row_tag    CHAR(21)  PRIMARY KEY  NOT NULL,  -- unique tag identifies each row
	row_tick   BIGINT                 NOT NULL,  -- tick when row was added
	hide       BIGINT                 NOT NULL,  -- 0 visible, nonzero ignore this row

	name_text  TEXT                   NOT NULL,  -- example holding any text including blank
	hits       BIGINT                 NOT NULL,  -- examle holding any integer
	some_hash  CHAR(52)               NOT NULL   -- example holding hash values
);

CREATE INDEX example1 ON example_table (hide, row_tick DESC);  -- index to get visible rows, sorted recent first, quickly
`)

//  _     _ _     _        _     _      
// | |__ (_) |_  | |_ __ _| |__ | | ___ 
// | '_ \| | __| | __/ _` | '_ \| |/ _ \
// | | | | | |_  | || (_| | |_) | |  __/
// |_| |_|_|\__|  \__\__,_|_.__/|_|\___|
//                                      

SQL(`
-- where is this hit coming from?
CREATE TABLE hit_table (
	row_tag         CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick        BIGINT    NOT NULL,  -- Trusted: exact time within hour_tick of the hit
	hide            BIGINT    NOT NULL,

	origin_text     TEXT      NOT NULL,  -- Trusted: the origin like "http://localhost:3000" or "https://example.com"

	browser_tag     CHAR(21)  NOT NULL,  -- Reported: the browser that hit us
	user_tag_text   TEXT      NOT NULL,  -- Derived: the user at that browser, or blank if none identifed
	ip_text         TEXT      NOT NULL,  -- Trusted: ip address, according to cloudflare
	geography_text  TEXT      NOT NULL,  -- Trusted: geographic information, according to cloudflare
	browser_text    TEXT      NOT NULL,  -- Reported: user agent string and WebGL hardware, according to the browser

	wrapper_hash    CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper

	hash            CHAR(52)  NOT NULL,  -- hash of printed cells to prevent duplicates within each hour
	CONSTRAINT hit1 UNIQUE (hash)        -- and corresponding constraint to enforce this and make upserts quick
);

CREATE INDEX hit2 ON hit_table (browser_tag,   row_tick DESC) WHERE hide = 0;
CREATE INDEX hit3 ON hit_table (user_tag_text, row_tick DESC) WHERE hide = 0;
`)

export async function recordHit({origin, browserTag, userTag, ipText, geographyText, browserText}) {
	checkText(origin)
	checkTag(browserTag); checkTagOrBlank(userTag)
	checkTextOrBlank(ipText); checkTextOrBlank(geographyText); checkTextOrBlank(browserText)
	checkHash(wrapper.hash)

	let now = Now()//tick count now, of this hit
	let row = {
		origin_text: origin,

		browser_tag: browserTag,
		user_tag_text: userTag,
		ip_text: ipText,
		geography_text: geographyText,
		browser_text: browserText,

		wrapper_hash: wrapper.hash,
	}
	row.hash = await hashText(//compute the hash of (below) and include it in the row we will add if it's unique
		roundDown(now, Time.hour)//the tick count of the start of the hour now is in
		+':'+
		stringo(row))//the values of those cells
	row.row_tick = now//add the exact time, note we excluded this from the hash
	await queryAddRowIfHashUnique({table: 'hit_table', row})
}

//                               _        _     _      
//  _ __   __ _ _ __ ___   ___  | |_ __ _| |__ | | ___ 
// | '_ \ / _` | '_ ` _ \ / _ \ | __/ _` | '_ \| |/ _ \
// | | | | (_| | | | | | |  __/ | || (_| | |_) | |  __/
// |_| |_|\__,_|_| |_| |_|\___|  \__\__,_|_.__/|_|\___|
//                                                     

SQL(`
-- go between a user's tag, route, and name as it appears on the page
CREATE TABLE name_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick     BIGINT                 NOT NULL,
	hide         BIGINT                 NOT NULL,

	user_tag     CHAR(21)               NOT NULL,

	normal_text  TEXT                   NOT NULL,  -- like "user-name", route lowercased to check unique
	formal_text  TEXT                   NOT NULL,  -- like "User-Name", route with case the user chose
	page_text    TEXT                   NOT NULL   -- like "User Name", the user's name for pages and cards
);

-- indices to ensure unique values in these columns among visible rows, for defense-in-depth, as setName() prevents duplicates first
CREATE UNIQUE INDEX name1 ON name_table (user_tag)    WHERE hide = 0;
CREATE UNIQUE INDEX name2 ON name_table (normal_text) WHERE hide = 0;
CREATE UNIQUE INDEX name3 ON name_table (formal_text) WHERE hide = 0;
CREATE UNIQUE INDEX name4 ON name_table (page_text)   WHERE hide = 0;

-- indices to make queries fast
CREATE INDEX name5 ON name_table (hide, user_tag,    row_tick DESC);  -- look up a user's route and name by their tag
CREATE INDEX name6 ON name_table (hide, normal_text, row_tick DESC);  -- what user is at this route? is it taken?
CREATE INDEX name7 ON name_table (hide, page_text,   row_tick DESC);  -- is this page name taken?
`)

export async function nameCheck({v}) {//ttd march, draft like from the check if your desired name is available, to choose and change a name
	if (!v.isValid) toss('valid', {v})//you have already done this check, but here too to make sure

	let rowNormal = await name_get({nameNormal: v.formNormal})
	let rowPage   = await name_get({namePage:   v.formPage})
	return {
		isAvailable: (!rowNormal) && (!rowPage),
		isAvailableNormal: !rowNormal,
		isAvailablePage: !rowPage,
		v,
	}
}

async function name_get({//look up user route and name information by calling with one of these:
	userTag,//a user's tag, like we're showing information about that user, or
	nameNormal,//a normalized route, like we're filling a request to that route, or
	namePage,//a user name, like we're seeing if it's available
}) {
	let row
	if      (given(userTag))    { checkTag(userTag);                   row = await queryTop({table: 'name_table', title: 'user_tag',    cell: userTag})    }
	else if (given(nameNormal)) { checkName({formNormal: nameNormal}); row = await queryTop({table: 'name_table', title: 'normal_text', cell: nameNormal}) }
	else if (given(namePage))   { checkName({formPage:   namePage});   row = await queryTop({table: 'name_table', title: 'page_text',   cell: namePage})   }
	else { toss('use', {userTag, nameNormal, namePage}) }

	if (!row) return false//the given user tag wasn't found, no user is at the given normalized route, or that name for the page is available
	return {userTag: row.user_tag, nameNormal: row.normal_text, nameFormal: row.formal_text, namePage: row.page_text}
}

//set the given normal, formal, and page names for the given user
//setName() does not make sure the names it sets are available--you've already done that before calling here!
//there is also defense in depth below, as the table's unique indices will make trying to add a duplicate row throw an error
async function name_set({userTag, nameNormal, nameFormal, namePage}) {
	checkTag(userTag); checkName({formNormal: nameNormal, formFormal: nameFormal, formPage: namePage})
	await name_delete({userTag})//replace an existing row about this user with a new one:
	await queryAddRow({table: 'name_table', row: {user_tag: userTag, normal_text: nameNormal, formal_text: nameFormal, page_text: namePage}})
}

//remove a user's route and name information, to hide or delete the user, freeing the user's route and page name for another person to take after this
async function name_delete({userTag, hideSet}) {//hide reason code optional
	checkTag(userTag);
	await queryHideRows({table: 'name_table', titleFind: 'user_tag', cellFind: userTag, hideSet})
}

//                                        _   _        _     _      
//  _ __   ___ _ __ ___  ___  _ __   __ _| | | |_ __ _| |__ | | ___ 
// | '_ \ / _ \ '__/ __|/ _ \| '_ \ / _` | | | __/ _` | '_ \| |/ _ \
// | |_) |  __/ |  \__ \ (_) | | | | (_| | | | || (_| | |_) | |  __/
// | .__/ \___|_|  |___/\___/|_| |_|\__,_|_|  \__\__,_|_.__/|_|\___|
// |_|                                                              

//--the person at this browser tag, who may have just been assigned this user tag even before finishing sign up, provided this personally identifying information
//like a dob or a cc number, which we can use to get them back in later if they've lost access
//this might hold normal, formal redacted, and hashed normal forms











//                   __ _ _        _        _     _      
//  _ __  _ __ ___  / _(_) | ___  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \| |_| | |/ _ \ | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) |  _| | |  __/ | || (_| | |_) | |  __/
// | .__/|_|  \___/|_| |_|_|\___|  \__\__,_|_.__/|_|\___|
// |_|                                                   

//--user name and route are in route_table, this is for the stuff beyond that like status message and avatar image
//ttd february, make profile_table

SQL(`
-- stuff on the user's profile page that doesn't need to be unique or indexed
CREATE TABLE profile_table (
	row_tag       CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick      BIGINT                 NOT NULL,
	hide          BIGINT                 NOT NULL,

	user_tag      CHAR(21)               NOT NULL,
	profile_text  TEXT                   NOT NULL,  -- printed object so you can add properties without changing schema; you never need to index by one
);

`)











//                      _            _        _     _      
//  ___  ___ _ ____   _(_) ___ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ '__\ \ / / |/ __/ _ \ | __/ _` | '_ \| |/ _ \
// \__ \  __/ |   \ V /| | (_|  __/ | || (_| | |_) | |  __/
// |___/\___|_|    \_/ |_|\___\___|  \__\__,_|_.__/|_|\___|
//                                                         

//service_table, complete record of our interactions with third-party services, to instrument them, and later, round robin them

//here's where you record what you send apis, and what you got back
//and how fast they are, how reliable they are
//how quickly users can complete tasks with them, all of that leads into robin









//           _   _   _                   _        _     _      
//  ___  ___| |_| |_(_)_ __   __ _ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ __| __| | '_ \ / _` / __| | __/ _` | '_ \| |/ _ \
// \__ \  __/ |_| |_| | | | | (_| \__ \ | || (_| | |_) | |  __/
// |___/\___|\__|\__|_|_| |_|\__, |___/  \__\__,_|_.__/|_|\___|
//                           |___/                             

SQL(`
-- settings for the application as a whole
CREATE TABLE settings_table (
	row_tag             CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick            BIGINT                 NOT NULL,
	hide                BIGINT                 NOT NULL,  -- standard starting three present for consistancy, but not used

	setting_name_text   TEXT                   NOT NULL,  -- the name of the setting kept by this row
	setting_value_text  TEXT                   NOT NULL   -- the value of that named setting, you have to store a number as text
);

CREATE UNIQUE INDEX settings1 ON settings_table (setting_name_text) WHERE hide = 0;  -- among visible rows, setting names must be unique
`)

export async function settingReadInt(name, defaultValue) {
	return textToInt(await settingRead(name, defaultValue))
}
export async function settingRead(name, defaultValue) {
	let defaultValueText = defaultValue+''
	checkText(name); checkTextOrBlank(defaultValueText)
	let row = await queryTop({table: 'settings_table', title: 'setting_name_text', cell: name})
	if (!row) {
		row = {setting_name_text: name, setting_value_text: defaultValueText}
		await queryAddRow({table: 'settings_table', row})
	}
	return row['setting_value_text']
}

export async function settingWrite(name, value) {
	let valueText = value+''
	checkText(name); checkTextOrBlank(valueText)
	let row = await queryUpdateCells({
		table:     'settings_table',
		titleFind: 'setting_name_text',  cellFind: name,
		titleSet:  'setting_value_text', cellSet:  valueText,
	})
	if (!row) {//above didn't find a row like that to update, so we need to create one with the given name and value
		row = {setting_name_text: name, setting_value_text: valueText}
		await queryAddRow({table: 'settings_table', row})
	}
}

//  _             _ _   _        _     _      
// | |_ _ __ __ _(_) | | |_ __ _| |__ | | ___ 
// | __| '__/ _` | | | | __/ _` | '_ \| |/ _ \
// | |_| | | (_| | | | | || (_| | |_) | |  __/
//  \__|_|  \__,_|_|_|  \__\__,_|_.__/|_|\___|
//                                            

SQL(`
-- a thing that may be happening recently, is it too late? too soon? too frequent?
CREATE TABLE trail_table (
	row_tag   CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick  BIGINT                 NOT NULL,
	hide      BIGINT                 NOT NULL,  -- not used, in the future we might hide old rows, or actually delete them!

	hash      CHAR(52)               NOT NULL   -- the hash of the message about the event that happened on row tick
);

CREATE INDEX trail1 ON trail_table (hide,       row_tick DESC);  -- hide or delete old rows quickly
CREATE INDEX trail2 ON trail_table (hide, hash, row_tick DESC);  -- get time sorted rows by hash
`)

//get the tick count of the most recent record about hash, 0 if none found
export async function trailRecent({hash}) {
	checkHash(hash)
	let row = await queryTop({table: 'trail_table', title: 'hash', cell: hash})
	return row ? row.row_tick : 0
}
//count how many records we have for hash since the given tick time in the past
export async function trailCount({hash, since}) {
	checkHash(hash); checkInt(since)
	return await queryCountSince({table: 'trail_table', title: 'hash', cell: hash, since})
}
//get the rows for hash since the given tick time in the past
export async function trailGet({hash, since}) {
	checkHash(hash); checkInt(since)
	return await queryGet({table: 'trail_table', title: 'hash', cell: hash, since})
}
//make a new record of the given hash right now
export async function trailAdd({now, hash}) {//optionally call Now() and pass it in, if you need it
	await trailAddHashes({now, hashes: [hash]})
}
export async function trailAddHashes({now, hashes}) {//an array of several hashes, all at the same time
	if (!now) now = Now()
	hashes.forEach(hash => checkHash(hash))
	await queryAddRows({table: 'trail_table', rows: hashes.map(hash => ({row_tick: now, hash: hash}))})
}

//                        _        _     _      
//  _   _ ___  ___ _ __  | |_ __ _| |__ | | ___ 
// | | | / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_| \__ \  __/ |    | || (_| | |_) | |  __/
//  \__,_|___/\___|_|     \__\__,_|_.__/|_|\___|
//                                              

SQL(`
-- does this user exist? have they finished signing up? are they a creator? are they staff? is their account hidden or closed?
CREATE TABLE user_table (
	row_tag       CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick      BIGINT                 NOT NULL,
	hide          BIGINT                 NOT NULL,

	user_tag      CHAR(21)               NOT NULL,
	stage         BIGINT                 NOT NULL,  -- 0 not used, 1 provisional, 2 normal, 
);

here is where you figure out, in this table? in the same column?
provisional/normal
creator/fan
normal/staff/god
visible/hidden by user; /hidden by staff; suspended, like not deleted, but user can't change; and unhidden
closed by user/by staff; and unclosed?


`)
























//what user, if any, is at the given browser?
export async function browserToUserTag({browserTag}) {//fast for hello1
	checkTag(browserTag)
	let user = {}
	user.browserTag = browserTag//echo back the browser tag we queried to get
	let u = await browser_get({browserTag})//always does this one query to be fast
	if (u) {
		user.userTag = u.userTag
		user.level = u.level
	}
	return user
}
export async function browserToUser({browserTag}) {//complete information about a user from multiple queries for hello2
	let user = await browserToUserTag({browserTag})
	if (user.userTag) {//we found a user tag, let's look up its name and more information about it
		let n = await name_get({userTag: user.userTag})
		if (n) {
			user.name = bundleValid(n.nameNormal, n.nameFormal, n.namePage)
		}
	}
	return user
}






export async function demonstrationSignGet({browserTag}) {
	checkTag(browserTag)

	let b = await browser_get({browserTag})//look for a user at the given browser
	if (b) {
		let n = await name_get({userTag: b.userTag})//find that user's name, right now their normalized route identifies them
		if (n) {
			return {isFound: true, browserTag, userTag: b.userTag, nameNormal: n.nameNormal, nameFormal: n.nameFormal, namePage: n.namePage}
		}
	}
	return {isFound: false, browserTag}
}
export async function demonstrationSignUp({browserTag, nameNormal, origin}) {
	checkTag(browserTag); checkName({formNormal: nameNormal})

	let n = await name_get({nameNormal})//confirm route is available in database
	if (n) return {isSignedUp: false, reason: 'NameTaken.', browserTag, nameNormal}

	let userTag = Tag()//create a new user, making the unique tag that will identify them
	await name_set({userTag, nameNormal, nameFormal: nameNormal, namePage: nameNormal})//ttd january, all the same for now
	await browser_in({browserTag, userTag, level: 2, origin})//and sign the new user into the requesting browser, in our records
	return {isSignedUp: true, browserTag, userTag, name: nameNormal, nameNormal}//just for testing; we won't send user tags to pages
}
export async function demonstrationSignIn({browserTag, nameNormal, origin}) {
	checkTag(browserTag); checkName({formNormal: nameNormal})

	let n = await name_get({nameNormal})//in this early simplification before user_table, a user exists by their tag with a route
	if (!n) return {isSignedIn: false, reason: 'NameUnknown.', browserTag, nameNormal}

	await browser_in({browserTag, userTag: n.userTag, level: 2, origin})//and sign the new user into the requesting browser, in our records
	return {isSignedIn: true, browserTag, userTag: n.userTag, name: nameNormal, nameNormal}//just for testing; we won't send user tags to pages
}
export async function demonstrationSignOut({browserTag, origin}) {
	checkTag(browserTag)

	let u = await demonstrationSignGet({browserTag})
	if (u.isFound) {
		await browser_out({browserTag, userTag: u.userTag, hideSet: 2, origin})//hide set 2 meaning at user's click we did this
		return {isSignedOut: true, browserTag, userTag: u.userTag}
	} else {
		return {isSignedOut: false, reason: 'NameNotFound.', browserTag}
	}
}
