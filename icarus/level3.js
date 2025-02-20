
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
textToInt, hasText, checkText, checkTextOrBlank, newline, deindent,
Data, decrypt, hashData, timeSafeEqual,
replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
hmacSign,
checkHash,

checkInt,
roundDown,

} from './level0.js'
import {
Tag, Limit, checkTag, checkTagOrBlank,
} from './level1.js'
import {
getAccess, Sticker, isLocal, isCloud,

/* level 2 query */

//query snippet
snippetClear, snippetPopulate, snippetQuery2, snippet2,
queryCountRows, queryCountAllRows, queryDeleteAllRows,

//query common
queryTop,
queryAddRow,
queryAddRows,
queryHideRows,
queryUpdateCells,

//query specialized
queryCountSince,
queryAddRowIfCellsUnique,
queryTopEqualGreater,

} from './level2.js'

//level3 ~ welcome to the level of business logic














/*
ttd december, figure out how bridge works now that you've got cors done
write something small and simple which ping4 and test can use, too; right now they're doing this
and, importantly, because you're building security upon it:
[]replace Sticker().isCloud with something that isn't based on fuzzy logic!

to begin--don't do the warm thing, either--the errors you were seeing were only for GET, not POST
well, now you sort of want to do it
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

noop(`sql
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

//                                 _        _        _     _      
//   _____  ____ _ _ __ ___  _ __ | | ___  | |_ __ _| |__ | | ___ 
//  / _ \ \/ / _` | '_ ` _ \| '_ \| |/ _ \ | __/ _` | '_ \| |/ _ \
// |  __/>  < (_| | | | | | | |_) | |  __/ | || (_| | |_) | |  __/
//  \___/_/\_\__,_|_| |_| |_| .__/|_|\___|  \__\__,_|_.__/|_|\___|
//                          |_|                                   

//use for practice

noop(`sql
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

noop(`sql
-- where is this hit coming from?
CREATE TABLE hit_table (
	row_tag         CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick        BIGINT                 NOT NULL,  -- exact time within hour_tick of the hit
	hide            BIGINT                 NOT NULL,

	hour_tick       BIGINT                 NOT NULL,  -- tick of the start of the hour this hit happened in
	browser_tag     CHAR(21)               NOT NULL,  -- the browser that hit us
	user_tag_text   TEXT                   NOT NULL,  -- the user at that browser, or blank if none identifed
	ip_text         TEXT                   NOT NULL,  -- ip address, according to cloudflare
	geography_text  TEXT                   NOT NULL,  -- geographic information, according to cloudflare
	browser_text    TEXT                   NOT NULL   -- user agent string and WebGL hardware, according to the browser
);

-- index to quickly log a new hit, coalesced to identical information in an hour, note UNIQUE, which *is necessary* for the query we're using with this table to add if unique in a single call
CREATE UNIQUE INDEX hit1 ON hit_table (hide, hour_tick, browser_tag, user_tag_text, ip_text, geography_text, browser_text);
`)

export async function recordHit({browserTag, userTag, ipText, geographyText, browserText}) {
	checkTag(browserTag); checkTagOrBlank(userTag)

	let t = Now()//tick count now, of this hit
	let d = roundDown(t, Time.hour)//tick count when the hour t is in began

	let row = {
		row_tag: Tag(),//standard for a new row
		row_tick: t,
		hide: 0,

		hour_tick: d,//cells that describe the first hit like this this hour
		browser_tag: browserTag,
		user_tag_text: userTag,
		ip_text: ipText,
		geography_text: geographyText,
		browser_text: browserText,
	}
	let titles = 'hide,hour_tick,browser_tag,user_tag_text,ip_text,geography_text,browser_text'
	await queryAddRowIfCellsUnique({table: 'hit_table', row, titles})
}

//                   __ _ _        _        _     _      
//  _ __  _ __ ___  / _(_) | ___  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \| |_| | |/ _ \ | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) |  _| | |  __/ | || (_| | |_) | |  __/
// | .__/|_|  \___/|_| |_|_|\___|  \__\__,_|_.__/|_|\___|
// |_|                                                   

//--user name and route are in route_table, this is for the stuff beyond that like status message and avatar image
//ttd february, make profile_table

//                      _            _        _     _      
//  ___  ___ _ ____   _(_) ___ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ '__\ \ / / |/ __/ _ \ | __/ _` | '_ \| |/ _ \
// \__ \  __/ |   \ V /| | (_|  __/ | || (_| | |_) | |  __/
// |___/\___|_|    \_/ |_|\___\___|  \__\__,_|_.__/|_|\___|
//                                                         

//service_table, complete record of our interactions with third-party services, to instrument them, and later, round robin them

//           _   _   _                   _        _     _      
//  ___  ___| |_| |_(_)_ __   __ _ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ __| __| | '_ \ / _` / __| | __/ _` | '_ \| |/ _ \
// \__ \  __/ |_| |_| | | | | (_| \__ \ | || (_| | |_) | |  __/
// |___/\___|\__|\__|_|_| |_|\__, |___/  \__\__,_|_.__/|_|\___|
//                           |___/                             

noop(`sql
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

noop(`sql
-- a thing that may be happening recently, is it too late? too soon? too frequent?
CREATE TABLE trail_table (
	row_tag   CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick  BIGINT                 NOT NULL,
	hide      BIGINT                 NOT NULL,  -- not used, in the future we might hide old rows, or actually delete them!

	hash      CHAR(52)               NOT NULL   -- the hash of the message about the event that happened on row tick
);

CREATE INDEX trail1 ON trail_table (hide, row_tick DESC);        -- hide or delete old rows quickly
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
//make a new record of the given hash right now
export async function trailAdd({hash}) {
	checkHash(hash)
	await queryAddRow({table: 'trail_table', row: {hash: hash}})
}








































//ttd february, pulled these two out of the alphebetized list to finish them

//  _                                       _        _     _      
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | |_) | |  __/
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|_.__/|_|\___|
//                                                                

noop(`sql
-- what user is signed into this browser? sign users in and out
CREATE TABLE browser_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL,  -- unique tag identifies each row
	row_tick     BIGINT                 NOT NULL,  -- tick when row was added
	hide         BIGINT                 NOT NULL,  -- 0 visible, nonzero ignore

	browser_tag  CHAR(21)               NOT NULL,  -- the browser a request is from
	user_tag     CHAR(21)               NOT NULL,  -- the user we've proven is using that browser
	level        BIGINT                 NOT NULL   -- 0 signed out, 1 provisional, 2 normal, 3 super user hour
);

-- index to get visible rows about a browser, recent first, quickly
CREATE INDEX browser1 ON browser_table (hide, browser_tag, row_tick DESC);  -- filter by browser
CREATE INDEX browser2 ON browser_table (hide, user_tag,    row_tick DESC);  -- or by user
CREATE INDEX browser3 ON browser_table (hide, level,       row_tick DESC);  -- quickly find expired super user hours
`)

export async function browserToUser({browserTag}) {//what user, if any, is signed in at this browser?
	checkTag(browserTag)
	let row = await queryTopEqualGreater({
		table: 'browser_table',
		title1: 'browser_tag', cell1: browserTag,
		title2: 'signed_in', cell2GreaterThan: 0,
	})
	return row?.user_tag
}
export async function browserSignIn({browserTag, userTag}) {//this user has proven their identity, sign them in here
	checkTag(browserTag); checkTag(userTag)
	await queryAddRow({
		table: 'browser_table',
		row: {
			browser_tag: browserTag,
			user_tag: userTag,
			signed_in: 1,//1 means this row is about the user signing in here and now
		}
	})
}
export async function browserSignOut({browserTag, userTag}) {//sign the user at this browser out everywhere
	checkTag(browserTag); checkTag(userTag)
	//first, hide existing rows about where the user has previously signed in and out; this signs the user out everywhere
	await queryHideRows({table: 'browser_table', titleFind: 'user_tag', cellFind: userTag, hideSet: 1})
	//also, make a new row to record when the user signed out, and that they signed out from this browser
	await queryAddRow({
		table: 'browser_table',
		row: {
			browser_tag: browserTag,
			user_tag: userTag,
			signed_in: 0,//0 means this row is about the user signing out
		}
	})
	//ttd january, no, add first, and then hide them all
	//and you don't have to pass hideSet if you don't want to, that is the default (confirm)
}





// <previous draft>
export async function authenticateSignGet({browserTag}) { return
	let userTag = await browserToUser({browserTag})
	let routeText
	if (userTag) routeText = await userToRoute({userTag})
	return {browserTag, userTag, routeText}
}
//make a new user and sign them in
export async function authenticateSignUp({browserTag, routeText}) { return
	log('made it to authenticate sign up', look({browserTag, routeText}))
	checkTag(browserTag); checkUserRoute(routeText)

	let occupant = await routeToUser({routeText})//confirm route is available in database
	if (occupant) return 'Taken.'

	let userTag = Tag()//create a new user, making the unique tag that will identify them
	await routeAdd({userTag, routeText})

	await browserSignIn({browserTag, userTag})//and sign the new user into this browser
	return {browserTag, userTag, routeText, note: 'signed up'}//just for testing; we won't send user tags to pages
}
//sign an existing user in
export async function authenticateSignIn({browserTag, routeText}) { return
	checkTag(browserTag); checkUserRoute(routeText)

	let userTag = await routeToUser({routeText})
	if (!userTag) return 'NotFound.'

	await browserSignIn({browserTag, userTag})
	return {browserTag, userTag, routeText, note: 'signed in'}//just for testing; we won't send user tags to pages
}
//if anybody's signed int this browser, sign them out!
export async function authenticateSignOut({browserTag}) { return
	let userTag = await browserToUser({browserTag})
	if (userTag) await browserSignOut({browserTag, userTag})
}
// </previous draft>



// <previous draft>
export async function userToRoute({userTag}) {//given a user tag, find their route
	let row = await queryTop({table: 'route_table', title: 'user_tag', cell: userTag})
	return row ? row.route_text : false
}
export async function routeToUser({routeText}) {//given a route, find the user tag, or false if vacant
	let row = await queryTop({table: 'route_table', title: 'route_text', cell: routeText})
	return row ? row.user_tag : false
}
export async function routeAdd({userTag, routeText}) {//create a new user at route; you already confirmed route is vacant
	await queryAddRow({
		table: 'route_table',
		row: {
			user_tag: userTag,
			route_text: routeText,
		}
	})
}
export async function routeRemove({userTag}) {//vacate the given user's route
	await queryHideRows({table: 'route_table', titleFind: 'user_tag', cellFind: userTag, hideSet: 1})
}
export async function routeMove({userTag, destinationRouteText}) {//move a user to a different route
	await routeRemove({userTag})
	await routeAdd({userTag, routeText: destinationRouteText})
}
// </previous draft>

















//                               _        _     _      
//  _ __   __ _ _ __ ___   ___  | |_ __ _| |__ | | ___ 
// | '_ \ / _` | '_ ` _ \ / _ \ | __/ _` | '_ \| |/ _ \
// | | | | (_| | | | | | |  __/ | || (_| | |_) | |  __/
// |_| |_|\__,_|_| |_| |_|\___|  \__\__,_|_.__/|_|\___|
//                                                     

noop(`sql
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
export async function getName({//look up user route and name information by one of these
	userTag,//a user's tag we already know from another part of this request, OR
	nameNormal,//the normalized route we're GETting for a browser, OR
	namePage,//a page name a user is trying to take, to see if it's unique
}) {
	let row
	if      (userTag)    { checkTag(userTag);           row = await queryTop({table: 'name_table', title: 'user_tag',    cell: userTag})    }
	else if (nameNormal) { checkNameNormal(nameNormal); row = await queryTop({table: 'name_table', title: 'normal_text', cell: nameNormal}) }
	else if (namePage)   { checkNamePage(namePage);     row = await queryTop({table: 'name_table', title: 'page_text',   cell: namePage})   }
	else { toss('use', {userTag, nameNormal, namePage}) }

	if (!row) return false//the given user tag wasn't found, no user is at the given normalized route, or that name for the page is available
	return {userTag: row.user_tag, nameNormal: row.normal_text, nameFormal: row.formal_text, namePage: row.page_text}
}
export async function setName({userTag, nameNormal, nameFormal, namePage}) {
	checkTag(userTag); checkName({nameNormal, nameFormal, namePage})
	if ((await getName({nameNormal})) || (await getName({namePage}))) toss('unique', {userTag, nameNormal, nameFormal, namePage})//the route and page name must not be taken
	await removeName({userTag})//replace an existing row about this user with a new one:
	await queryAddRow({table: 'name_table', row: {user_tag: userTag, normal_text: nameNormal, formal_text: nameFormal, page_text: namePage}})
}
export async function removeName({userTag, hideSet}) {//remove a user's route and name information, to hide or delete the user, freeing the user's route and page name for another person to take after this
	checkTag(userTag);
	await queryHideRows({table: 'name_table', titleFind: 'user_tag', cellFind: userTag, hideSet})
}




































