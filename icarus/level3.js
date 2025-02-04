
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
textToInt, hasText, checkText, newline, deindent,
Data, decrypt, subtleHash, timeSafeEqual,
stringify, replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
hmacSign,

checkUserRoute, validUserRoute,

} from './level0.js'
import {
Tag, tagLength, checkTag, checkTagOrBlank,
} from './level1.js'
import {
getAccess, Sticker, isLocal, isCloud,

/* level 2 query */

getDatabase,

snippetClear,
snippetPopulate,
snippetQuery2,
snippet2,

queryFilterRecent,
queryFilterMostRecent,
queryFilterSortTop,
queryFilterSortAll,

queryAddRowIfCellsUnique,
queryHideRows,

querySetCell, querySetCellOrAddRow,
queryGetCell, queryGetCellOrAddRow,
queryGetRow,  queryGetRowOrAddRow,

queryAddRow,
queryAddRows,

queryCountRows,
queryCountAllRows,
queryDeleteAllRows,

checkQueryTitle,
checkQueryRow,
checkQueryCell,

checkQueryTag,
checkQueryHash,
checkQueryText,
checkQueryInt,

checkQueryTagOrBlank,

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
		v.length == browserTagValuePrefix.length+tagLength &&
		v.startsWith(browserTagValuePrefix)) {//read and return

		return v.slice(-tagLength)

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










/*
const reservedRoutes = `
about
account
admin
administrator
app
ban
billing
blog
community
config
contact
creator
dashboard
developer
e
f
fan
faq
feed
feedback
forum
help
home
i
legal
login
logout
manage
me
messages
moderator
my
notifications
official
privacy
profile
register
report
root
search
settings
shop
signin
signout
signup
staff
status
store
subscribe
support
system
terms
unsubscribe
user
verify
`
*/
/*
and what are your ideas for user names?
upper and lower case fine
length 1 through 42 fine
-_. fine but can't have multiple non letter number in a row
can a  name start with a number or _? yes, to match twitter like _SomeName_

check your previous notes on this
*/


















































//                                 _        _        _     _      
//   _____  ____ _ _ __ ___  _ __ | | ___  | |_ __ _| |__ | | ___ 
//  / _ \ \/ / _` | '_ ` _ \| '_ \| |/ _ \ | __/ _` | '_ \| |/ _ \
// |  __/>  < (_| | | | | | | |_) | |  __/ | || (_| | |_) | |  __/
//  \___/_/\_\__,_|_| |_| |_| .__/|_|\___|  \__\__,_|_.__/|_|\___|
//                          |_|                                   

//use for practice

`sql
-- get a list of all indices on all tables; you can ignore the _pkey ones which are the primary key defaults
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';
`

export async function snippetQuery3() {
	let data, error
	try { data = await snippet3() } catch (e) { error = e }
	if (error) return look(error)
	else return data
}
export async function snippet3() {
	log("hi from snippet 3")
}








//           _   _   _                   _        _     _      
//  ___  ___| |_| |_(_)_ __   __ _ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ __| __| | '_ \ / _` / __| | __/ _` | '_ \| |/ _ \
// \__ \  __/ |_| |_| | | | | (_| \__ \ | || (_| | |_) | |  __/
// |___/\___|\__|\__|_|_| |_|\__, |___/  \__\__,_|_.__/|_|\___|
//                           |___/                             

//[ran]
export async function settingReadInt(name, defaultValue) {
	return textToInt(await settingRead(name, defaultValue))
}
export async function settingRead(name, defaultValue) {
	let defaultValueText = defaultValue+''
	return await queryGetCellOrAddRow({
		table: 'settings_table',
		titleFind: 'setting_name_text',
		cellFind: name,
		titleGet: 'setting_value_text',
		rowAddDefault: {
			setting_name_text: name,
			setting_value_text: defaultValueText,
		}
	})
}
//[ran]
export async function settingWrite(name, value) {
	let valueText = value+''
	return await querySetCellOrAddRow({
		table: 'settings_table',
		titleFind: 'setting_name_text',
		cellFind: name,
		titleSet: 'setting_value_text',
		cellSet: valueText,
		rowAddDefault: {
			setting_name_text: name,
			setting_value_text: valueText,
		}
	})
}







// legacy, access_table, which has the global password and unlocks messaging

//[ran]
export async function legacyAccessSet(browserTag, signedInSet) {
	let signedInSetInt = signedInSet ? 1 : 0
	await queryAddRow({//always makes a new row
		table: 'access_table',
		row: {
			row_tag: Tag(),
			row_tick: Now(),
			hide: 0,
			browser_tag: browserTag,
			signed_in: signedInSetInt,
		}
	})
}
//[ran]
export async function legacyAccessGet(browserTag) {
	let row = await queryFilterSortTop({//never makes a new row
		table: 'access_table',
		title: 'browser_tag', cell: browserTag,
		titleSort: 'row_tick',
	})
	return row?.signed_in
}











//                                               _        _     _      
//   __ _  _____   _____ _ __ _ __   ___  _ __  | |_ __ _| |__ | | ___ 
//  / _` |/ _ \ \ / / _ \ '__| '_ \ / _ \| '__| | __/ _` | '_ \| |/ _ \
// | (_| | (_) \ V /  __/ |  | | | | (_) | |    | || (_| | |_) | |  __/
//  \__, |\___/ \_/ \___|_|  |_| |_|\___/|_|     \__\__,_|_.__/|_|\___|
//  |___/                                                              

//when did we last do this? how frequently have we done this recently?





//  _     _ _     _        _     _      
// | |__ (_) |_  | |_ __ _| |__ | | ___ 
// | '_ \| | __| | __/ _` | '_ \| |/ _ \
// | | | | | |_  | || (_| | |_) | |  __/
// |_| |_|_|\__|  \__\__,_|_.__/|_|\___|
//                                      

noop(`sql
-- where is this hit coming from?
CREATE TABLE hit_table (
	row_tag        CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick       BIGINT                 NOT NULL,  -- time of first hit like this in this quarter day
	hide           BIGINT                 NOT NULL,
	quarter_day    BIGINT                 NOT NULL,  -- tick rounded down to 6 hour window
	browser_tag    CHAR(21)               NOT NULL,  -- the browser that hit us
	user_tag_text  TEXT                   NOT NULL,  -- the user at that browser, or blank if none identifed
	ip_text        TEXT                   NOT NULL,  -- ip address, according to cloudflare
	city_text      TEXT                   NOT NULL,  -- geographic location, according to cloudflare
	agent_text     TEXT                   NOT NULL,  -- user agent string, according to the browser
	graphics_text  TEXT                   NOT NULL   -- webgl hardware info, according to the browser
);

-- index to quickly log a new hit, coalesced to identical information in each quarter day
CREATE UNIQUE INDEX hit_table_quarter_day_index
ON hit_table (hide, quarter_day, browser_tag, user_tag_text, ip_text, city_text, agent_text, graphics_text);
`)

export async function recordHit({browserTag, userTag, ip, city, agent, graphics}) {
	checkTag(browserTag); checkTagOrBlank(userTag)

	let t = Now()//tick count now, of this hit
	let d = (Math.floor(t / (6*Time.hour)))*(6*Time.hour)//tick count when the quarter day t is in began

	let row = {
		row_tag: Tag(),//standard for a new row
		row_tick: t,
		hide: 0,

		quarter_day: d,//cells that describe the first hit like this in this quarter day time period
		browser_tag: browserTag,
		user_tag_text: userTag,
		ip_text: ip,
		city_text: city,
		agent_text: agent,
		graphics_text: graphics
	}
	let titles = 'hide,quarter_day,browser_tag,user_tag_text,ip_text,city_text,agent_text,graphics_text'
	await queryAddRowIfCellsUnique({table: 'hit_table', row, titles})
}








//              _   _                _   _           _         _        _     _      
//   __ _ _   _| |_| |__   ___ _ __ | |_(_) ___ __ _| |_ ___  | |_ __ _| |__ | | ___ 
//  / _` | | | | __| '_ \ / _ \ '_ \| __| |/ __/ _` | __/ _ \ | __/ _` | '_ \| |/ _ \
// | (_| | |_| | |_| | | |  __/ | | | |_| | (_| (_| | ||  __/ | || (_| | |_) | |  __/
//  \__,_|\__,_|\__|_| |_|\___|_| |_|\__|_|\___\__,_|\__\___|  \__\__,_|_.__/|_|\___|
//                                                                                   

//a user proves they are the same person as before








//                   __ _ _        _        _     _      
//  _ __  _ __ ___  / _(_) | ___  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \| |_| | |/ _ \ | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) |  _| | |  __/ | || (_| | |_) | |  __/
// | .__/|_|  \___/|_| |_|_|\___|  \__\__,_|_.__/|_|\___|
// |_|                                                   

//first it's just status message here; eventually this is user name, avatar image, all that













//ttd january - today's new level: self identified users with names that are routes


/*
bookmark january
ok, clicking through these four work
[]make another pass to be sure
[]see "Taken." get reported back up to the user
[]deal with an exception here telling the page 500--catch those in the page
[]understand where you check what up and down the stack
[]improve the form so you can show it to friends, like gray the buttons until they've entered text for user name that is an acceptable route; very minimal

and then what's next? maybe status message in a new table,
which the user, once signed in, can edit--new component for this
and then user page at a route that holds that message
and that's where you figure out how to get nuxt to do mixed root routes, which hopefully is common and easy
*/

//[]
//determine what user is signed into the given connected browser, and also get their route text (which we're using as user name in this early intermediate stage)
export async function authenticateSignGet({browserTag}) {
	let userTag = await browserToUser({browserTag})
	let routeText
	if (userTag) routeText = await userToRoute({userTag})
	return {browserTag, userTag, routeText}
}
//[]
//make a new user and sign them in
export async function authenticateSignUp({browserTag, routeText}) {
	log('made it to authenticate sign up', look({browserTag, routeText}))
	checkTag(browserTag); checkUserRoute(routeText)

	let occupant = await routeToUser({routeText})//confirm route is available in database
	if (occupant) return 'Taken.'

	let userTag = Tag()//create a new user, making the unique tag that will identify them
	await routeAdd({userTag, routeText})

	await browserSignIn({browserTag, userTag})//and sign the new user into this browser
	return {browserTag, userTag, routeText, note: 'signed up'}//just for testing; we won't send user tags to pages
}
//[]
//sign an existing user in
export async function authenticateSignIn({browserTag, routeText}) {
	checkTag(browserTag); checkUserRoute(routeText)

	let userTag = await routeToUser({routeText})
	if (!userTag) return 'NotFound.'

	await browserSignIn({browserTag, userTag})
	return {browserTag, userTag, routeText, note: 'signed in'}//just for testing; we won't send user tags to pages
}
//[]
//if anybody's signed int this browser, sign them out!
export async function authenticateSignOut({browserTag}) {
	let userTag = await browserToUser({browserTag})
	if (userTag) await browserSignOut({browserTag, userTag})
}







//                  _         _        _     _      
//  _ __ ___  _   _| |_ ___  | |_ __ _| |__ | | ___ 
// | '__/ _ \| | | | __/ _ \ | __/ _` | '_ \| |/ _ \
// | | | (_) | |_| | ||  __/ | || (_| | |_) | |  __/
// |_|  \___/ \__,_|\__\___|  \__\__,_|_.__/|_|\___|
//                                                  

noop(`sql
-- go between a user's tag and route
CREATE TABLE route_table (
	row_tag     CHAR(21)  PRIMARY KEY  NOT NULL,
	row_tick    BIGINT                 NOT NULL,
	hide        BIGINT                 NOT NULL,

	user_tag    CHAR(21)               NOT NULL,
	route_text  TEXT                   NOT NULL   -- unique working route, normalized to lower case
);

-- quickly find the most recent visible row by user tag, and by route
CREATE INDEX route_table_index_1 ON route_table (hide, user_tag,   row_tick DESC);
CREATE INDEX route_table_index_2 ON route_table (hide, route_text, row_tick DESC);
`)

//[ran]
export async function userToRoute({userTag}) {//given a user tag, find their route
	let row = await queryFilterRecent({table: 'route_table', title: 'user_tag', cell: userTag})
	return row ? row.route_text : false
}
//[ran]
export async function routeToUser({routeText}) {//given a route, find the user tag, or false if vacant
	let row = await queryFilterRecent({table: 'route_table', title: 'route_text', cell: routeText})
	return row ? row.user_tag : false
}
//[ran]
export async function routeAdd({userTag, routeText}) {//create a new user at route; you already confirmed route is vacant
	await queryAddRow({
		table: 'route_table',
		row: {row_tag: Tag(), row_tick: Now(), hide: 0,
			user_tag: userTag,
			route_text: routeText,
		}
	})
}
//[ran]
export async function routeRemove({userTag}) {//vacate the given user's route
	await queryHideRows({table: 'route_table', titleFind: 'user_tag', cellFind: userTag, hideSet: 1})
}
//[ran]
export async function routeMove({userTag, destinationRouteText}) {//move a user to a different route
	await routeRemove({userTag})
	await routeAdd({userTag, routeText: destinationRouteText})
}

//ttd january []confirm that an exception here causes throws up all the way back to the page
//[]and hits datadog
//and then deal with exceptions in the page









//  _                                       _        _     _      
// | |__  _ __ _____      _____  ___ _ __  | |_ __ _| |__ | | ___ 
// | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_) | | | (_) \ V  V /\__ \  __/ |    | || (_| | |_) | |  __/
// |_.__/|_|  \___/ \_/\_/ |___/\___|_|     \__\__,_|_.__/|_|\___|
//                                                                

//who's signed into this browser? sign users in and out

noop(`sql
-- what user is signed into this browser?
CREATE TABLE browser_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL,  -- unique tag identifies each row
	row_tick     BIGINT                 NOT NULL,  -- tick when row was added
	hide         BIGINT                 NOT NULL,  -- 0 to start, nonzero reason we can ignore row

	browser_tag  CHAR(21)               NOT NULL,  -- the browser a request is from
	user_tag     CHAR(21)               NOT NULL,  -- the user we've proven is using that browser
	signed_in    BIGINT                 NOT NULL   -- 0 signed out, 1 signed in, 2 authenticated second factor
);

-- index to get visible rows about a browser, recent first, quickly
CREATE INDEX browser_table_browser_tag_index ON browser_table (hide, browser_tag, row_tick DESC);
`)

export async function browserToUser({browserTag}) {//what user, if any, is signed in at this browser?
	checkTag(browserTag)
	let row = await query_browserToUser({browserTag})
	return row?.user_tag
}
async function query_browserToUser({browserTag}) {//level2-style up here in level3; this query is bespoke with two eq and a gt
	checkQueryTag(browserTag)
	let database = await getDatabase()
	let {data, error} = (await database
		.from('browser_table')
		.select('*')//retrieve the matching rows
		.eq('hide', 0)//only rows that are not hidden
		.eq('browser_tag', browserTag)//rows about this browser
		.gt('signed_in', 0)//that describe a user signing in, gt is greater than
		.order('row_tick', {ascending: false})//most recent first
		.limit(1)//just one row
	)
	if (error) toss('supabase', {error})
	return data[0]//returns the row, or undefined if no row
}

export async function browserSignIn({browserTag, userTag}) {//this user has proven their identity, sign them in here
	checkTag(browserTag); checkTag(userTag)
	await queryAddRow({
		table: 'browser_table',
		row: {row_tag: Tag(), row_tick: Now(), hide: 0,
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
		row: {row_tag: Tag(), row_tick: Now(), hide: 0,
			browser_tag: browserTag,
			user_tag: userTag,
			signed_in: 0,//0 means this row is about the user signing out
		}
	})
}














