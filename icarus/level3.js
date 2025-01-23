
import {
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
hasText, checkText, newline, deindent,
Data, decrypt, subtleHash, timeSafeEqual,
stringify, replaceAll, replaceOne,
parseEnvStyleFileContents,
ashFetchum,
hmacSign,
} from './level0.js'
import {
Tag, tagLength, checkTag,
} from './level1.js'
import {
getAccess,
queryCountRows, queryAddRow, querySetCell, queryGetRow, queryGetRows,
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
const forceCloudLambda = false
const resourceLocalNetwork23 = 'http://localhost:4000/prod'//check your local Network 23 affliate
const resourceCloudNetwork23 = 'https://api.net23.cc'//or our global connectivity via satellite
export async function fetchNetwork23(nuxtDollarFetchFunction, providerDotService, path, body) {//pass in $fetch which nuxt has imported in site/server/api/caller.js but not here in icarus

	/*
	warm is the module that the lambda will use, like "AE" for amazon email
	if warm is set, then do a first warmup call, right here, before doing teh real call
	so callers of fetchNetwork23 get that warmup service for free, and don't have to think about it
	*/
	checkText(path); if (path[0] != '/') toss('data', {path, body})//call this with path like '/door'
	let access = await getAccess()
	let host = (forceCloudLambda || Sticker().isCloud) ? resourceCloudNetwork23 : resourceLocalNetwork23
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
	return message+`&hash=${encodeURIComponent(hash.base64())}`
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























//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

/*
this sitting goal: get all current database use factored through generalized functions
then tonight you can go on a notes and previous scraps deleteathon
*/

export async function snippetClear() {
	return 'hi from snippet clear'

}
export async function snippetPopulate() {
	return 'hi from snippet populate'

}
export async function snippetQuery() {
	return 'hi from snippet query'

	/*
	let r = await queryAddRow({table: 'example_table', row: {
		row_tag: Tag(),
		row_tick: Now(),
		hide: 0,
		name_text: 'missing hits',
		some_hash: 'J3K3TYOGOWVONV7ZLOUPPJWBSYRTCFHHFCEURQZQIMQEMKVOJ2SQ',
	}})
	log(look(r))
	*/
}

//these are the database functions in use; next, use the generalized functions above to refactor these away

//insert a new row into table_access with the given row tag, browser tag, and signed in status
export async function query_AccessTableInsert(browserTag, signedIn) {
	queryAddRow({table: 'access_table', row: {row_tick: Now(), row_tag: Tag(), browser_tag: browserTag, signed_in: signedIn}})
}
//query table_access to get all the rows with a matching browser tag
export async function query_AccessTableQuery(browserTag) {
	let rows = await queryGetRows({table: 'access_table', title: 'browser_tag', cell: browserTag, titleSort: 'row_tick'})
	return rows
}

export async function query_HitRowExists() {
	let hits = await queryCountRows({table: 'settings_table', title: 'setting_name_text', cell: 'hits'})
	return hits > 0
}
export async function query_HitCreateRow() {
	await queryAddRow({table: 'settings_table', row: {setting_name_text: 'hits', setting_value_text: '0'}})
}
export async function query_HitReadRow() {//returns the count
	let row = await queryGetRow({table: 'settings_table', title: 'setting_name_text', cell: 'hits'})
	return row.setting_value_text
}
export async function query_HitWriteRow(newValue) {
	await querySetCell({table: 'settings_table', titleFind: 'setting_name_text', cellFind: 'hits', titleSet: 'setting_value_text', cellSet: newValue})
	log('incremented')
}




































