
import {//from wrapper
wrapper,
} from './wrapper.js'
import {//from level0
Time, Now, sayDate, sayTick,
log, logTo, say, look, defined, noop, test, ok, toss,
textToInt, hasText, checkText, checkTextOrBlank, newline,
Tag, checkTagOrBlank, checkTag,
Data, decryptData, hasTextSame,
replaceAll, replaceOne,
hmacSign,
checkHash, checkInt, roundDown, hashText, given,
randomCode, hashToLetter,
makePlain, makeObject, makeText,
safefill, deindent,
isInSimulationMode, ageNow, prefixTags,
random32,
} from './level0.js'
import {//from level1
Limit, checkName, validateName,
bundleValid,
} from './level1.js'
import {//from level2
Sticker, stickerParts, isLocal, isCloud,
Task, fetchWorker, fetchLambda, fetchProvider,

/* level 2 query */
SQL, grid, getDatabase,

//query snippet
queryCountRows, queryCountAllRows,

//query common
queryTop,
queryGet,
queryAddRow,
queryAddRows,
queryHide,
queryUpdateCells,

//query specialized
queryCountSince,
queryAddRowIfHashUnique,
queryTopEqualGreater,
queryTopSinceMatchGreater,

} from './level2.js'

//level3 ~ welcome to the level of business logic

















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
	return await _vhsSign(Data({base16: Key('vhs, secret')}), path, Now(), expiration, Tag())
}
async function _vhsSign(secret, path, now, expiration, seed) {//so we've factored out this core for testing, below
	let message = `path=${encodeURIComponent(path)}&tick=${now+expiration}&seed=${seed}`
	let hash = await hmacSign('SHA-256', secret, Data({text: message}))
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
//ttd february2025--so the idea here is, then for a form, you bundle the verification of multiple fields into a single object. does that work with different steps? this is just a sketch at this point, but you like the concept of getting standard "whole form is good to go" logic in one place, for client and server, rather than in Vue handlers above. (you really like that idea) as well as having a standard .ok for a whole form, rather than just a bunch of individual form field valid flags




























//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

/*
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
*/








/*
ttd november
lots of things you can think of as credentials, and move and handle here, many entirely

[]totp codes
[]email and sms addresses
[]traditional passwords
[]user names, those are reserved on the site, and owned by a single user
[]oauth accounts
[]ethereum address
and you now realize: []browsers a user is signed in to!
*/

//                    _            _   _       _                                             _ 
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |  _ __   __ _ ___ _____      _____  _ __ __| |
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \ / _` / __/ __\ \ /\ / / _ \| '__/ _` |
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | |_) | (_| \__ \__ \\ V  V / (_) | | | (_| |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| | .__/ \__,_|___/___/ \_/\_/ \___/|_|  \__,_|
//                                                |_|                                          

export async function credentialPasswordGet({userTag}) {
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	let row = rows[0]
	if (row) return {hash: row.k1_text, cycles: textToInt(row.k2_text)}
	return false//no current password
}
export async function credentialPasswordSet({userTag, hash, cycles}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.'})
	await credentialSet({userTag, type: 'Password.', event: 4, k1: hash, k2: cycles+''})
}
export async function credentialPasswordRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Password.'})
}

//                    _            _   _       _   _        _         
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | | |_ ___ | |_ _ __  
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | __/ _ \| __| '_ \ 
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | || (_) | |_| |_) |
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \__\___/ \__| .__/ 
//                                                             |_|    

//totp: a user can have a single verified enrollment or nothing; k1 is the shared secret key which generates codes
export async function credentialTotpGet({userTag}) {
	checkTag(userTag)
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	let row = rows[0]
	if (row) return row.k1_text//return their totp secret in base32
	return false//no current totp enrollment
}
export async function credentialTotpSet({userTag, secret}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.'})
	await credentialSet({userTag, type: 'Totp.', event: 4, k1: secret})
}
export async function credentialTotpRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Totp.'})
}

//                    _            _   _       _   _                                     
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| | | |__  _ __ _____      _____  ___ _ __ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \| '__/ _ \ \ /\ / / __|/ _ \ '__|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | |_) | | | (_) \ V  V /\__ \  __/ |   
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| |_.__/|_|  \___/ \_/\_/ |___/\___|_|   
//                                                                                       

//browser: user is signed in at this browser; k1 is browserHash
export async function credentialBrowserGet({browserHash}) {//find what user, if any, is signed in at the given browser
	checkHash(browserHash)
	let rows = await queryGet('credential_table', {type_text: 'Browser.', k1_text: browserHash, event: 4})
	let row = rows[0]
	if (row) return {userTag: row.user_tag}
	return false//no one signed in at this browser
}
export async function credentialBrowserSet({userTag, browserHash}) {//sign this user in at this browser
	checkTag(userTag); checkHash(browserHash)
	await credentialSet({userTag, type: 'Browser.', event: 4, k1: browserHash})
}
export async function credentialBrowserRemove({userTag}) {//sign this user out everywhere
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Browser.'})
}

//                    _            _   _       _                              
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |  _ __   __ _ _ __ ___   ___ 
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | | | '_ \ / _` | '_ ` _ \ / _ \
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | | | | (_| | | | | | |  __/
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_| |_| |_|\__,_|_| |_| |_|\___|
//                                                                            

//lookup between user tags and names to render a profile page, let the user see their name, or choose or change it
export async function credentialNameGet({//returns false not found, or {userTag, v} with all three valid name forms
	//provide any one of these:
	userTag,//get a user's name, all three forms, if the user exists and has a name; used to show the user their own name info
	f0, f2,//make sure normalized and display names are available; these two are just helpers to credentialNameCheck below
	raw1,//given a GETing slug like "Tokyo-girl", look up her userTag and return v.f1 "Tokyo-Girl" for history replace state
}) {
	let row, rows
	if (given(userTag)) { checkTag(userTag)
		rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Name.', event: 4})
	} else if (given(f0)) { checkText(f0)
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: f0, event: 4})
	} else if (given(f2)) { checkText(f2)
		rows = await queryGet('credential_table', {type_text: 'Name.', f2_text: f2, event: 4})
	} else if (given(raw1)) {
		let v = validateName(raw1); if (!v.ok) return false
		rows = await queryGet('credential_table', {type_text: 'Name.', f0_text: v.f0, event: 4})
	} else { toss('use', {userTag, f0, f2, raw1}) }

	row = rows[0]
	if (row) return {userTag: row.user_tag, v: bundleValid({f0: row.f0_text, f1: row.f1_text, f2: row.f2_text})}
	return false//not found
}

//set the given new name for a user, if valid and available, and free up an old name if they had one
export async function credentialNameSet({userTag, raw1, raw2}) {
	checkTag(userTag)
	let v = await credentialNameCheck({raw1, raw2})
	if (!v) return false
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.'})
	await credentialSet({userTag, type: 'Name.', event: 4, f0: v.f0, f1: v.f1, f2: v.f2})
	return v
}

//given desired route and display names, check that they're valid and available
export async function credentialNameCheck({//returns false taken or not valid, or bundled v with all three name forms
	//provide both of these:
	raw1,//desired route text like "Tokyo-Girl"; we'll normalize that down to form 0 "tokyo-girl" for you
	raw2,//desired visual version like "東京 Girl 🌸"; user may have chosen text that doesn't normalize to match raw1's f0 and f1
}) {
	let v1 = validateName(raw1)//validate route input, produces f0 and f1
	let v2 = validateName(raw2)//separately validate display name, produces f2, only
	if (!(v1.ok && v2.ok)) return false

	if (await credentialNameGet({f0: v1.f0})) return false//make sure desired route, normalized, is not already taken
	if (await credentialNameGet({f2: v2.f2})) return false//we also require display names to be unique
	return bundleValid({f0: v1.f0, f1: v1.f1, f2: v2.f2})//note how we composite together both validated objects ✂️
}

//remove a user's name credential, freeing it for others
export async function credentialNameRemove({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag, type_text: 'Name.'})
}

//                    _            _   _       _        _                                                   _
//   ___ _ __ ___  __| | ___ _ __ | |_(_) __ _| |   ___| | ___  ___  ___    __ _  ___ ___ ___  _   _ _ __ | |_
//  / __| '__/ _ \/ _` |/ _ \ '_ \| __| |/ _` | |  / __| |/ _ \/ __|/ _ \  / _` |/ __/ __/ _ \| | | | '_ \| __|
// | (__| | |  __/ (_| |  __/ | | | |_| | (_| | | | (__| | (_) \__ \  __/ | (_| | (_| (_| (_) | |_| | | | | |_
//  \___|_|  \___|\__,_|\___|_| |_|\__|_|\__,_|_|  \___|_|\___/|___/\___|  \__,_|\___\___\___/ \__,_|_| |_|\__|
//

//permanently close a user's account, hiding all their credentials
export async function credentialCloseAccount({userTag}) {
	checkTag(userTag)
	await queryHide('credential_table', {user_tag: userTag})//hide all credential types at once
}

grid(async () => {//password: set, change, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialPasswordGet({userTag})) == false)//no password yet
	await credentialPasswordSet({userTag, hash: 'hash1', cycles: 100})//set initial
	ok((await credentialPasswordGet({userTag})).hash == 'hash1')//verify set
	await credentialPasswordSet({userTag, hash: 'hash2', cycles: 200})//change password
	let result = await credentialPasswordGet({userTag})
	ok(result.hash == 'hash2' && result.cycles == 200)//verify changed
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Password.', event: 4})
	ok(rows.length == 1)//only one active password after change
	await credentialPasswordRemove({userTag})
	ok((await credentialPasswordGet({userTag})) == false)//now gone
})
grid(async () => {//totp: set, re-enroll, verify single active, remove
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialTotpGet({userTag})) == false)//no totp yet
	await credentialTotpSet({userTag, secret: 'SECRETAAAAAAAAA1'})//enroll
	ok((await credentialTotpGet({userTag})) == 'SECRETAAAAAAAAA1')//verify enrolled
	await credentialTotpSet({userTag, secret: 'SECRETBBBBBBBBB2'})//re-enroll (new phone)
	ok((await credentialTotpGet({userTag})) == 'SECRETBBBBBBBBB2')//verify new secret
	let rows = await queryGet('credential_table', {user_tag: userTag, type_text: 'Totp.', event: 4})
	ok(rows.length == 1)//only one active totp after re-enroll
	await credentialTotpRemove({userTag})
	ok((await credentialTotpGet({userTag})) == false)//now gone
})
grid(async () => {//browser: sign out removes all sessions for one user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	let browser1 = random32()
	let browser2 = random32()
	ok((await credentialBrowserGet({browserHash: browser1})) == false)//nobody signed in yet
	await credentialBrowserSet({userTag, browserHash: browser1})//sign in at browser1
	await credentialBrowserSet({userTag, browserHash: browser2})//sign in at browser2
	ok((await credentialBrowserGet({browserHash: browser1})).userTag == userTag)//both sessions active
	ok((await credentialBrowserGet({browserHash: browser2})).userTag == userTag)
	await credentialBrowserRemove({userTag})//sign out everywhere
	ok((await credentialBrowserGet({browserHash: browser1})) == false)//both sessions gone
	ok((await credentialBrowserGet({browserHash: browser2})) == false)
})
grid(async () => {//browser: multi-user flow, sign out doesn't affect other users
	let user1 = Tag()
	let user2 = Tag()
	let browserA = random32()
	let browserB = random32()
	let browserC = random32()
	await credentialBrowserSet({userTag: user1, browserHash: browserA})//user1 signs in at A
	await credentialBrowserSet({userTag: user2, browserHash: browserB})//user2 signs in at B
	await credentialBrowserSet({userTag: user1, browserHash: browserC})//user1 also signs in at C
	ageNow(Time.minute)//time passes
	ok((await credentialBrowserGet({browserHash: browserA})).userTag == user1)//everyone still signed in
	ok((await credentialBrowserGet({browserHash: browserB})).userTag == user2)
	ok((await credentialBrowserGet({browserHash: browserC})).userTag == user1)
	await credentialBrowserRemove({userTag: user1})//user1 signs out everywhere
	ok((await credentialBrowserGet({browserHash: browserA})) == false)//user1 gone from A and C
	ok((await credentialBrowserGet({browserHash: browserC})) == false)
	ok((await credentialBrowserGet({browserHash: browserB})).userTag == user2)//user2 unaffected at B
})
grid(async () => {//name: get by userTag, get by raw1, check collisions
	let {clear} = await getDatabase()
	await clear('credential_table')
	let userTag = Tag()
	ok((await credentialNameGet({userTag})) == false)//no name yet
	await credentialNameSet({userTag, raw1: 'Tokyo-Girl', raw2: 'Tokyo Girl'})//set name
	let result = await credentialNameGet({userTag})//get by userTag
	ok(result.userTag == userTag && result.v.f0 == 'tokyo-girl')
	ok(result.v.f1 == 'Tokyo-Girl' && result.v.f2 == 'Tokyo Girl')
	ok((await credentialNameGet({raw1: ''})) == false)//invalid raw1 returns false
	ok((await credentialNameGet({raw1: 'nonexistent'})) == false)//valid but not found
	let lookup = await credentialNameGet({raw1: 'tokyo-GIRL'})//sloppy case normalizes and finds
	ok(lookup.userTag == userTag && lookup.v.f1 == 'Tokyo-Girl')//returns canonical f1
	ok((await credentialNameCheck({raw1: 'Valid', raw2: ''})) == false)//check: invalid raw2
	ok((await credentialNameCheck({raw1: 'TOKYO-GIRL', raw2: 'Other'})) == false)//check: f0 collision
	ok((await credentialNameCheck({raw1: 'other', raw2: 'Tokyo Girl'})) == false)//check: f2 collision
	let v = await credentialNameCheck({raw1: 'Available', raw2: 'Available Name'})//check: success
	ok(v.ok && v.f0 == 'available')
})
grid(async () => {//name: remove frees name for another user
	let {clear} = await getDatabase()
	await clear('credential_table')
	let user1 = Tag()
	let user2 = Tag()
	await credentialNameSet({userTag: user1, raw1: 'taken', raw2: 'Taken'})//user1 takes name
	ok((await credentialNameSet({userTag: user2, raw1: 'taken', raw2: 'Taken'})) == false)//user2 blocked
	await credentialNameRemove({userTag: user1})//user1 removes
	ok((await credentialNameGet({userTag: user1})) == false)//user1 has no name
	let v = await credentialNameSet({userTag: user2, raw1: 'taken', raw2: 'Taken'})//user2 can take it
	ok(v.ok && v.f0 == 'taken')
})
grid(async () => {//name: change frees old name for others (the Bob story)
	let {clear} = await getDatabase()
	await clear('credential_table')
	let user1 = Tag()
	let user2 = Tag()
	let v1 = await credentialNameSet({userTag: user1, raw1: 'Bob', raw2: 'Bob'})//user1 takes "bob"
	ok(v1.ok && v1.f0 == 'bob')
	ok((await credentialNameSet({userTag: user2, raw1: 'Bob', raw2: 'Bob'})) == false)//user2 can't take "bob"
	let v2 = await credentialNameSet({userTag: user1, raw1: 'Super-Bob', raw2: 'Super Bob'})//user1 changes to "super-bob"
	ok(v2.ok && v2.f0 == 'super-bob')
	ok((await credentialNameGet({userTag: user1})).v.f0 == 'super-bob')//user1 now has super-bob
	let v3 = await credentialNameSet({userTag: user2, raw1: 'Bob', raw2: 'Bob'})//user2 can now take "bob"
	ok(v3.ok && v3.f0 == 'bob')
	ok((await credentialNameGet({userTag: user1})).v.f0 == 'super-bob')//both have correct names
	ok((await credentialNameGet({userTag: user2})).v.f0 == 'bob')
})
grid(async () => {//sign-up creates three credentials, then user removes name and password
	let {clear} = await getDatabase()
	await clear('credential_table')

	//sign up: create user with name, password, and browser credentials
	let userTag = Tag()
	let browserHash = random32()
	await credentialNameSet({userTag, raw1: 'New-User', raw2: 'New User'})
	await credentialPasswordSet({userTag, hash: 'testhash', cycles: 42})
	await credentialBrowserSet({userTag, browserHash})

	//verify all three credentials exist
	ok((await credentialNameGet({userTag})).v.f0 == 'new-user')
	ok((await credentialPasswordGet({userTag})).cycles == 42)
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)

	//user removes their name
	await credentialNameRemove({userTag})
	ok((await credentialNameGet({userTag})) == false)//name gone
	ok((await credentialPasswordGet({userTag})).cycles == 42)//password still there
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//still signed in

	//user removes their password
	await credentialPasswordRemove({userTag})
	ok((await credentialNameGet({userTag})) == false)//name still gone
	ok((await credentialPasswordGet({userTag})) == false)//password gone
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)//still signed in
})
grid(async () => {//close account: user signs up, closes account, can't sign back in
	let {clear} = await getDatabase()
	await clear('credential_table')

	//sign up: create user with name, password, and browser credentials
	let userTag = Tag()
	let browserHash = random32()
	await credentialNameSet({userTag, raw1: 'Closing-User', raw2: 'Closing User'})
	await credentialPasswordSet({userTag, hash: 'myhash', cycles: 50})
	await credentialBrowserSet({userTag, browserHash})

	//verify all three credentials exist
	ok((await credentialNameGet({userTag})).v.f0 == 'closing-user')
	ok((await credentialPasswordGet({userTag})).cycles == 50)
	ok((await credentialBrowserGet({browserHash})).userTag == userTag)

	//user closes their account
	await credentialCloseAccount({userTag})

	//all credentials gone
	ok((await credentialNameGet({userTag})) == false)//name gone
	ok((await credentialPasswordGet({userTag})) == false)//password gone
	ok((await credentialBrowserGet({browserHash})) == false)//signed out

	//name is now available for another user
	let user2 = Tag()
	let v = await credentialNameSet({userTag: user2, raw1: 'Closing-User', raw2: 'Closing User'})
	ok(v.ok && v.f0 == 'closing-user')//user2 can take the freed name
})

SQL(`
-- how can a user sign in? is what they just said valid to sign them in?
CREATE TABLE credential_table (
	row_tag    CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick   BIGINT    NOT NULL,
	hide       BIGINT    NOT NULL,

	user_tag   CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed a credential, like an address
	type_text  TEXT      NOT NULL,  -- credential type, like "Phone.", "Twitter.", "Ethereum.", "Totp.", "Password." or others
	event      BIGINT    NOT NULL,  -- 2 mentioned, 3 challenged, 4 validated, 1 removed

	-- if this credential is a name or address, like email, phone, oauth, web3 wallet, store the validated forms here:
	f0_text    TEXT      NOT NULL,  -- normalized form of address or name, to match as unique
	f1_text    TEXT      NOT NULL,  -- formal form of address, to send messages
	f2_text    TEXT      NOT NULL,  -- page form of address, to show the user

	-- alternatively or additionally, a credential of this type may have some tag, hash, secret key, or something else, maybe just a note:
	k1_text    TEXT      NOT NULL,
	k2_text    TEXT      NOT NULL,
	k3_text    TEXT      NOT NULL,
	k4_text    TEXT      NOT NULL
);

CREATE INDEX credential1 ON credential_table (hide, user_tag, row_tick DESC);  -- filter by user

CREATE INDEX credential2 ON credential_table (hide, type_text, f0_text) WHERE f0_text != '';  -- look up non blank text by type
CREATE INDEX credential3 ON credential_table (hide, type_text, f1_text) WHERE f1_text != '';
CREATE INDEX credential4 ON credential_table (hide, type_text, f2_text) WHERE f2_text != '';

CREATE INDEX credential5 ON credential_table (hide, type_text, k1_text) WHERE k1_text != '';
CREATE INDEX credential6 ON credential_table (hide, type_text, k2_text) WHERE k2_text != '';
CREATE INDEX credential7 ON credential_table (hide, type_text, k3_text) WHERE k3_text != '';
CREATE INDEX credential8 ON credential_table (hide, type_text, k4_text) WHERE k4_text != '';
`)
//ttd november, should event be a tag instead of a number? it's a litle arcane

export async function credentialGet({userTag}) {//get all the credential information about the given user
	//ttd november
}
export async function credentialSet({userTag, type, event, f0 = '', f1 = '', f2 = '', k1 = '', k2 = '', k3 = '', k4 = ''}) {
	checkTag(userTag); checkText(type); checkInt(event, 1)//these three are required, everything else is optional
	checkTextOrBlank(f0); checkTextOrBlank(f1); checkTextOrBlank(f2)
	checkTextOrBlank(k1); checkTextOrBlank(k2); checkTextOrBlank(k3); checkTextOrBlank(k4)
	await queryAddRow({table: 'credential_table', row: {
		user_tag: userTag,
		type_text: type,
		event: event,
		f0_text: f0, f1_text: f1, f2_text: f2,
		k1_text: k1, k2_text: k2, k3_text: k3, k4_text: k4,
	}})
}















//ttd november, you think that address_table can be completely moved into credential_table

//            _     _                     _        _     _      
//   __ _  __| | __| |_ __ ___  ___ ___  | |_ __ _| |__ | | ___ 
//  / _` |/ _` |/ _` | '__/ _ \/ __/ __| | __/ _` | '_ \| |/ _ \
// | (_| | (_| | (_| | | |  __/\__ \__ \ | || (_| | |_) | |  __/
//  \__,_|\__,_|\__,_|_|  \___||___/___/  \__\__,_|_.__/|_|\___|
//                                                              

//--this user mentioned, or proved they can read messages sent to, this address
//address_table, ttd february2025
//actually don't use; instead do this in credential table above, ttd november

/*
simplest question to answer: is this address
proven owned and controlled by an existing user
not (maybe totally new, maybe mentioned but not validated yet)

*/


SQL(`
-- has a user proven they control an address?
CREATE TABLE address_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	user_tag       CHAR(21)  NOT NULL,  -- the user who has mentioned, controls, or removed an address

	type_text      TEXT      NOT NULL,  -- what type of address this is, like "Email." or "Phone."
	address0_text  TEXT      NOT NULL,  -- normalized form of address, to match as unique
	address1_text  TEXT      NOT NULL,  -- formal form of address, to send messages
	address2_text  TEXT      NOT NULL,  -- page form of address, to show the user

	event          BIGINT    NOT NULL   -- 2 mentioned, 3 challenged, 4 validated, 1 removed
);

CREATE INDEX address1 ON address_table (hide, user_tag,                 row_tick DESC);  -- filter by user
CREATE INDEX address2 ON address_table (hide, type_text, address0_text, row_tick DESC);  -- or by address
`)

export async function addressRemoved({userTag, type, v})    { await address_add({userTag, type, v, event: 1}) }
export async function addressMentioned({userTag, type, v})  { await address_add({userTag, type, v, event: 2}) }
export async function addressChallenged({userTag, type, v}) { await address_add({userTag, type, v, event: 3}) }
export async function addressValidated({userTag, type, v})  { await address_add({userTag, type, v, event: 4}) }
async function address_add({userTag, type, v, event}) {//v is the result of a validate function, containing the three forms
	await queryAddRow({table: 'address_table', row: {
		user_tag: userTag,
		type_text: type,
		address0_text: v.f0, address1_text: v.f1, address2_text: v.f2,
		event: event,
	}})
}
/*
addressToUser - given an address, get the user who we've challenged it for, or validated, and has not removed it
so returns a user tag and ownership level 3 or 4, or falsey if the address is available

userToAddresses - given a user, get the addresses we've challenged and validated, that have not been removed
so returns an array of addresses, different types, events collapsed to be most recent 3 or 4
*/



export async function addressToUser({type, f0}) {
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
ttd march2025
adding domain_text to browser_table
browser_hash is from the browser
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
	row_tag       CHAR(21)  NOT NULL PRIMARY KEY,  -- unique tag identifies each row
	row_tick      BIGINT    NOT NULL,              -- tick when row was added
	hide          BIGINT    NOT NULL,              -- 0 visible, nonzero ignore

	browser_hash  CHAR(52)  NOT NULL,  -- the browser a request is from
	user_tag      CHAR(21)  NOT NULL,  -- the user we've proven is using that browser
	level         BIGINT    NOT NULL,  -- 0 signed out, 1 provisional, 2 normal, 3 super user hour

	origin_text   TEXT      NOT NULL   -- the protocol, port, subdomain, and domain for the the local storage holding browser tag
);

-- index to get visible rows about a browser, recent first, quickly
CREATE INDEX browser1 ON browser_table (browser_hash, row_tick DESC) WHERE hide = 0;  -- filter by browser
CREATE INDEX browser2 ON browser_table (user_tag,     row_tick DESC) WHERE hide = 0;  -- or by user
CREATE INDEX browser3 ON browser_table (level,        row_tick DESC) WHERE hide = 0;  -- quickly find expired super user hours
`)
//ttd february2025, trying the pattern where the group of functions which exclusively touch the table are named example_someThing, as below. if it works well for browser and name tables, then look at expanding to everywhere

async function browser_get({browserHash}) {//what user, if any, is signed in at this browser?
	checkHash(browserHash)
	let row = await queryTopEqualGreater({
		table: 'browser_table',
		title1: 'browser_hash', cell1: browserHash,
		title2: 'level', cell2GreaterThan: 0,
	})
	return row ? {browserHash: row.browser_hash, userTag: row.user_tag, level: row.level, origin: row.origin_text} : false
}
async function browser_in({browserHash, userTag, level, origin}) {//this user has proven their identity, sign them in here
	checkHash(browserHash); checkTag(userTag); checkInt(level, 1); checkText(origin)//make sure level is 1+
	await queryAddRow({
		table: 'browser_table',
		row: {
			browser_hash: browserHash,
			user_tag: userTag,
			level,//sign in at level 1 provisional, 2 normal, or 3 start an hour of elevated permissions
			origin_text: origin,
		}
	})
}
async function browser_out({browserHash, userTag, hideSet, origin}) {//sign this user out everywhere; browser tag included but doesn't matter; hide reason code is optional for a note different than default 1
	checkHash(browserHash); checkTag(userTag); checkText(origin)
	await queryAddRow({//record that this user's sign-out happened now, and from this browser
		table: 'browser_table',
		row: {
			browser_hash: browserHash,
			user_tag: userTag,
			level: 0,//level 0 means this row is about the user signing out
			origin_text: origin,
		}
	})
	await queryHide('browser_table', {user_tag: userTag}, {hideSet})//hide all the rows about this user, including the one we just made, signing them out, everywhere
}



































//functions in the code system call these handlers to report that the person at browser tag challenged an address, and we sent a code there, and, possibly, later, entered the correct code, validating that address
export async function browserChallengedAddress({browserHash, provider, type, v}) {
	//address_table
	//service_table
}
export async function browserValidatedAddress({browserHash, provider, type, v}) {
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

export async function codeSend({browserHash, provider, type, v}) {//v is the address, valid, containing the three forms

	//look up the user tag, even though we're not using it with code yet
	let userTag = (await demonstrationSignGet({browserHash}))?.userTag

	let permit = await codePermit(v.f0)
	if (!permit.success) return permit//return the failed permit directly, bubbling up

	let code = await codeCompose({length: permit.useLength, sticker: true})
	await fetchLambda('/message', {body: {
		provider: provider,
		service: type,
		address: v.f1,
		subjectText: code.subjectText,//email subject
		messageText: code.messageText,//email body as text, or complete SMS message
		messageHtml: code.messageHtml,//email body as HTML
	}})
	await codeSent({browserHash, provider, type, v, permit, code})

	return {success: true}
}

//can we send another code to this address now?
async function codePermit(address0) {
	const now = Now()

	//use the code table to find out how many codes we've sent address
	let rows = await code_get_address({address0})//get all the rows about the given address
	let rowsWeek = rows.filter(row => row.row_tick >= now - Code.week)//those over the past 5 days
	let rowsDay = rowsWeek.filter(row => row.row_tick >= now - Code.day)//those in just the last 24 hours
	let rowsLive = rowsDay.filter(row => row.row_tick >= now - Code.expiration)//past 20 minutes, so could be active still

	if (rowsDay.length >= Code.limitHard) {//we've already sent 10 codes to this address in the last 24 hours!
		return {success: false, reason: 'CoolHard.'}
	}

	if (rowsWeek.length >= Code.limitSoft) {//we've sent 2+ codes to this address in the last 5 days
		let cool = rowsWeek[0].row_tick + Code.minutes//tick when this address cooled down
		if (now < cool) return {success: false, reason: 'CoolSoft.'}//hasn't happened yet
	}

	return {
		success: true,
		useLength: rowsWeek.length < Code.limitStong ? Code.short : Code.standard,
		wouldReplace: (rowsLive.length && rowsLive[0].lives) ? rowsLive[0].row_tag : false,//include the code tag of a code that we sent to this address less than 20 minutes ago, and could still be verified. if you send a replacement code, you have to kill this one
	}
}

//make a new random code and compose message text about it
async function codeCompose({length, sticker}) {
	let c = {}

	c.codeTag = Tag()
	c.letter = await hashToLetter(c.codeTag, Code.alphabet)
	c.code = randomCode(length)
	c.hash = await hashText(c.codeTag+c.code)

	c.subjectText = `Code ${c.letter} ${c.code} for ${Key('message brand')}`
	const warning = ` - Don't tell anyone, they could steal your whole account!`
	sticker = sticker ? 'STICKER' : ''//gets replaced by the sticker on the lambda

	c.messageText = `${c.subjectText}${warning}${sticker}`
	c.messageHtml = `<html><body><p style="font-size:24px; font-family: -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="color:#ff00ff;">${c.subjectText}</span><span style="color:#808080;">${warning}${sticker}</span></p></body></html>`
	return c
}

//what it looks like to use these functions to send a code
async function codeSent({browserHash, provider, type, v, permit, code}) {

	if (permit.wouldReplace) {
		await code_set_lives({codeTag: permit.wouldReplace, lives: 0})//invalidate the code this new one will replace
	}

	//take care of address_table and maybe also service_table
	await browserChallengedAddress({browserHash, provider, type, v})

	//record that we sent the new code
	await code_add({codeTag: code.codeTag, browserHash, provider, type, v, hash: code.hash, lives: Code.guesses})
}

//is this browser expecting any codes? needs to run fast!
export async function browserToCodes({browserHash}) {
	let rows = await queryTopSinceMatchGreater({table: 'code_table',
		since: Now() - Code.expiration,//get not yet expired codes
		title1: 'browser_hash', cell1: browserHash,//for this browser
		title2: 'lives', cell2GreaterThan: 0,//that haven't been guessed to death or otherwise revoked
	})
	let codes = []//from the database rows, prepare records that the page will keep in a list
	if (rows) {
		for (let row of rows) {
			codes.push({
				tag: row.row_tag,//the code's tag, also the row tag, letting the page identify the challenge
				tick: row.row_tick,//when we sent the code
				lives: row.lives,//how many guesses remain on this code

				letter: await hashToLetter(row.row_tag, Code.alphabet),//the page could derive this but we'll do it
				addressType: row.type_text,//the type of address, like "Email."
				address0: row.address0_text,
				address1: row.address1_text,//the address we used with the api
				address2: row.address2_text,
				//note we importantly do not send hash to the page, that's the secret part!
			})
		}
	}
	return codes//return empty if no codes for this browser right now
}

//the person at browserHash used the box on the page to enter a code, which could be right or wrong
export async function codeEnter({browserHash, codeTag, codeCandidate}) {
	let now = Now()
	let r

	let row = await code_get({codeTag})//find the row about it
	log('hi in code enter', look({browserHash, codeTag, codeCandidate, row}))
	if (!row || row.browser_hash != browserHash || !row.lives) {
		toss('page', {browserHash, codeTag, codeCandidate, row})//very unusual, like from a tampered-with page
	}

	if (row.row_tick + Code.expiration < now) {//too late, respond with lives 0 to tell the page the user needs to request a new code
		return {success: false, reason: 'Expired.', lives: 0}
	}

	if (hasTextSame(row.hash, await hashText(codeTag+codeCandidate))) {//correct guess
		await code_set_lives({codeTag, lives: 0})//a correct guess also kills the code
		await browserValidatedAddress({
			browserHash,
			provider: row.provider_text,
			type: row.type_text,
			address0: row.address0_text, address1: row.address1_text, address2: row.address2_text,
		})
		return {success: true, lives: 0}

	} else {//wrong guess

		let lives = row.lives - 1
		await code_set_lives({codeTag, lives})
		return {success: false, reason: 'Wrong.', lives}//user may be able to guess again on this code
	}
}










//                _        _        _     _      
//   ___ ___   __| | ___  | |_ __ _| |__ | | ___ 
//  / __/ _ \ / _` |/ _ \ | __/ _` | '_ \| |/ _ \
// | (_| (_) | (_| |  __/ | || (_| | |_) | |  __/
//  \___\___/ \__,_|\___|  \__\__,_|_.__/|_|\___|
//                                               

export const Code = {//factory settings for address verification codes

	expiration: 20*Time.minute,//For each code: dead in 20 minutes,
	guesses:    4,             //and dead after 4 wrong guesses. Also, dead after issued replacement

	limitHard: 24,      //For each address: limit 24 codes,
	day:       Time.day,//in 24 hours.

	limitSoft: 2,            //Also, first 2 codes in,
	week:      5*Time.day,   //5 days we can issue back to back, then,
	minutes:   1*Time.minute,//1 minute delay between sending codes to an address.

	limitStong: 1,//First 1 code in 5 days to an address,
	short:      4,//can be short like "1234".
	standard:   6,//after that, longer like "123456"

	alphabet: 'ABCDEFHJKMNPQRTUVWXYZ',//21 letters that don't look like numbers, omitting gG~9, iI~1, lL~1, oO~0, sS~5
	/*
	For a 50% chance to guess correctly we need N guesses such that:
		(1 - p)^N = 0.5   where p = 1/(total possible codes)
	Using the small-p approximation: ln(1-p) ≈ -p, we get:
		N ≈ ln(0.5)/(-p) ≈ 0.693 / p

	For 4-digit codes: 
		p = 1/10000 = 0.0001
		N ≈ 0.693 / 0.0001 ≈ 6930 guesses
		With 4 guesses every 5 days:
			Periods = 6930 / 4 ≈ 1732.5
			Total time ≈ 1732.5 * 5 days = 8662.5 days ≈ 23.7 years

	For 6-digit codes:
		p = 1/1000000 = 0.000001
		N ≈ 0.693 / 0.000001 ≈ 693000 guesses
		With 4 guesses every hour:
			Periods = 693000 / 4 ≈ 173250
			Total time ≈ 173250 hours ≈ 173250/8760 ≈ 19.8 years
	*/
}
Object.freeze(Code)

SQL(`
-- what code like 1234 have we sent to the person at a browser to prove they control that address?
CREATE TABLE code_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,  -- uniquely identifies the row, and also used as the code tag
	row_tick       BIGINT    NOT NULL,              -- when we sent the code, the start of the code's 20 minute lifetime
	hide           BIGINT    NOT NULL,              -- not used, instead set lives to 0 below to revoke the code

	browser_hash   CHAR(52)  NOT NULL,  -- the browser that entered, and must verify, the address

	provider_text  TEXT      NOT NULL,  -- note we sent the code using "Amazon." or "Twilio."
	type_text      TEXT      NOT NULL,  -- address type like "Email." or "Phone."
	address0_text  TEXT      NOT NULL,  -- address in the three forms, we'll use normal to find and page to show
	address1_text  TEXT      NOT NULL,
	address2_text  TEXT      NOT NULL,

	hash           CHAR(52)  NOT NULL,  -- the hash of the code tag followed by the 4 or 6 numeral code

	lives          BIGINT    NOT NULL   -- starts 4 guesses, decrement, or set directly to 0 to invalidate
);

CREATE INDEX code1 ON code_table (browser_hash,             row_tick DESC) WHERE hide = 0;  -- filter by browser
CREATE INDEX code2 ON code_table (type_text, address0_text, row_tick DESC) WHERE hide = 0;  -- or by address
-- ^ttd march2025, maybe, change all indices to partial with where hide zero like above
`)

async function code_get({codeTag}) {//get the row about a code
	let rows = await queryGet('code_table', {row_tag: codeTag})
	return rows.length ? rows[0] : false
}
async function code_get_browser({browserHash}) {//get all the rows about the given browser
	return await queryGet('code_table', {browser_hash: browserHash})
}
async function code_get_address({address0}) {//get all the rows about the given address
	return await queryGet('code_table', {address0_text: address0})
}

async function code_set_lives({codeTag, lives}) {//set the number of lives, decrement on wrong guess or 0 to revoke
	await queryUpdateCells({table: 'code_table',
		titleFind: 'row_tag', cellFind: codeTag,
		titleSet:  'lives',   cellSet: lives,
	})
}
async function code_add({codeTag, browserHash, provider, type, v, hash, lives}) {//make a record to send a new code
	await queryAddRow({table: 'code_table', row: {
		row_tag: codeTag,//unique, identifies row and code, so chosen earlier to save a copy
		browser_hash: browserHash,
		provider_text: provider,
		type_text: type,
		address0_text: v.f0, address1_text: v.f1, address2_text: v.f2,
		hash,
		lives,
	}})
}










//      _      _               _        _     _      
//   __| | ___| | __ _ _   _  | |_ __ _| |__ | | ___ 
//  / _` |/ _ \ |/ _` | | | | | __/ _` | '_ \| |/ _ \
// | (_| |  __/ | (_| | |_| | | || (_| | |_) | |  __/
//  \__,_|\___|_|\__,_|\__, |  \__\__,_|_.__/|_|\___|
//                     |___/                         

SQL(`
-- how long are we taking to do different tasks for the user?
CREATE TABLE delay_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	task_text      TEXT      NOT NULL,  -- the kind of task we did, like "Hello."
	d1             BIGINT    NOT NULL,  -- several task defined slots for durations in milliseconds
	d2             BIGINT    NOT NULL,
	d3             BIGINT    NOT NULL,
	d4             BIGINT    NOT NULL,
	d5             BIGINT    NOT NULL,

	wrapper_hash   CHAR(52)  NOT NULL,
	origin_text    TEXT      NOT NULL,
	browser_hash   CHAR(52)  NOT NULL,
	user_tag_text  TEXT      NOT NULL,  -- user tag or blank if none at the browser
	ip_text        TEXT      NOT NULL
);

CREATE INDEX delay1 ON delay_table               (task_text, row_tick DESC) WHERE hide = 0;
CREATE INDEX delay2 ON delay_table (wrapper_hash, task_text, row_tick DESC) WHERE hide = 0;
`)

export async function recordDelay({task, d1, d2, d3, d4, d5, origin, browserHash, userTag, ipText}) {
	checkText(task)
	checkInt(d1, -1); checkInt(d2, -1); checkInt(d3, -1); checkInt(d4, -1); checkInt(d5, -1)
	checkText(origin); checkHash(browserHash); checkTagOrBlank(userTag); checkTextOrBlank(ipText);
	await queryAddRow({table: 'delay_table', row: {
		task_text: task,
		d1, d2, d3, d4, d5,

		wrapper_hash: wrapper.hash,
		origin_text: origin,
		browser_hash: browserHash,
		user_tag_text: userTag,
		ip_text: ipText,
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
	row_tag    CHAR(21)  NOT NULL PRIMARY KEY,  -- unique tag identifies each row
	row_tick   BIGINT    NOT NULL,              -- tick when row was added
	hide       BIGINT    NOT NULL,              -- 0 visible, nonzero ignore this row

	name_text  TEXT      NOT NULL,  -- example holding any text including blank
	hits       BIGINT    NOT NULL,  -- examle holding any integer
	some_hash  CHAR(52)  NOT NULL   -- example holding hash values
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

	browser_hash    CHAR(52)  NOT NULL,  -- Reported: the browser that hit us
	user_tag_text   TEXT      NOT NULL,  -- Derived: the user at that browser, or blank if none identifed
	ip_text         TEXT      NOT NULL,  -- Trusted: ip address, according to cloudflare
	geography_text  TEXT      NOT NULL,  -- Trusted: geographic information, according to cloudflare
	browser_text    TEXT      NOT NULL,  -- Reported: user agent string and WebGL hardware, according to the browser

	wrapper_hash    CHAR(52)  NOT NULL,  -- Trusted: software version hash from wrapper

	hash            CHAR(52)  NOT NULL,  -- hash of printed cells to prevent duplicates within each hour
	CONSTRAINT hit1 UNIQUE (hash)        -- and corresponding constraint to enforce this and make upserts quick
);

CREATE INDEX hit2 ON hit_table (browser_hash,  row_tick DESC) WHERE hide = 0;
CREATE INDEX hit3 ON hit_table (user_tag_text, row_tick DESC) WHERE hide = 0;
`)

export async function recordHit({origin, browserHash, userTag, ipText, geographyText, browserText}) {
	checkText(origin)
	checkHash(browserHash); checkTagOrBlank(userTag)
	checkTextOrBlank(ipText); checkTextOrBlank(geographyText); checkTextOrBlank(browserText)
	checkHash(wrapper.hash)

	let now = Now()//tick count now, of this hit
	let row = {
		origin_text: origin,

		browser_hash: browserHash,
		user_tag_text: userTag,
		ip_text: ipText,
		geography_text: geographyText,
		browser_text: browserText,

		wrapper_hash: wrapper.hash,
	}
	row.hash = await hashText(//compute the hash of (below) and include it in the row we will add if it's unique
		roundDown(now, Time.hour)//the tick count of the start of the hour now is in
		+':'+
		makeText(row))//the values of those cells
	row.row_tick = now//add the exact time, note we excluded this from the hash
	await queryAddRowIfHashUnique({table: 'hit_table', row})
}

//ttd november, you think that you can entirely move name_table -> credential_table

//                               _        _     _      
//  _ __   __ _ _ __ ___   ___  | |_ __ _| |__ | | ___ 
// | '_ \ / _` | '_ ` _ \ / _ \ | __/ _` | '_ \| |/ _ \
// | | | | (_| | | | | | |  __/ | || (_| | |_) | |  __/
// |_| |_|\__,_|_| |_| |_|\___|  \__\__,_|_.__/|_|\___|
//                                                     

//bookmark
SQL(`
-- go between a user's tag, route, and name as it appears on the page
CREATE TABLE name_table (
	row_tag     CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick    BIGINT    NOT NULL,
	hide        BIGINT    NOT NULL,

	user_tag    CHAR(21)  NOT NULL,

	name0_text  TEXT      NOT NULL,  -- like "user-name", route lowercased to check unique
	name1_text  TEXT      NOT NULL,  -- like "User-Name", route with case the user chose
	name2_text  TEXT      NOT NULL   -- like "User Name", the user's name for pages and cards
);

-- indices to ensure unique values in these columns among visible rows, for defense-in-depth, as setName() prevents duplicates first
CREATE UNIQUE INDEX name1 ON name_table (user_tag)   WHERE hide = 0;
CREATE UNIQUE INDEX name2 ON name_table (name0_text) WHERE hide = 0;
CREATE UNIQUE INDEX name3 ON name_table (name1_text) WHERE hide = 0;
CREATE UNIQUE INDEX name4 ON name_table (name2_text) WHERE hide = 0;

-- indices to make queries fast
CREATE INDEX name5 ON name_table (hide, user_tag,   row_tick DESC);  -- look up a user's route and name by their tag
CREATE INDEX name6 ON name_table (hide, name0_text, row_tick DESC);  -- what user is at this route? is it taken?
CREATE INDEX name7 ON name_table (hide, name2_text, row_tick DESC);  -- is this page name taken?
`)

export async function nameCheck({v}) {//ttd march2025, draft like from the check if your desired name is available, to choose and change a name
	if (!v.ok) toss('valid', {v})//you have already done this check, but here too to make sure

	let task = Task({name: 'name check'})
	let row0 = await name_get({name0: v.f0})
	let row2 = await name_get({name2: v.f2})
	task.available = {
		isAvailable: (!row0) && (!row2),
		isAvailable0: !row0,
		isAvailable2: !row2,
		v,
	}
	task.finish({success: true})
	return task
}

//ttd: name_table is deprecated, will be removed once credential_table name functions are complete
//note: queryTop usage here assumes 0 or 1 rows per key, but doesn't guarantee correct row if multiple exist
async function name_get({//look up user route and name information by calling with one of these:
	userTag,//a user's tag, like we're showing information about that user, or
	name0,//a normalized route, like we're filling a request to that route, or
	name2,//a user name, like we're seeing if it's available
}) {
	let row
	if      (given(userTag)) { checkTag(userTag);      row = await queryTop({table: 'name_table', title: 'user_tag',   cell: userTag}) }
	else if (given(name0))   { checkName({f0: name0}); row = await queryTop({table: 'name_table', title: 'name0_text', cell: name0})   }
	else if (given(name2))   { checkName({f2: name2}); row = await queryTop({table: 'name_table', title: 'name2_text', cell: name2})   }
	else { toss('use', {userTag, name0, name2}) }

	if (!row) return false//the given user tag wasn't found, no user is at the given normalized route, or that name for the page is available
	return {userTag: row.user_tag, name0: row.name0_text, name1: row.name1_text, name2: row.name2_text}
}

//set the given normal, formal, and page names for the given user
//setName() does not make sure the names it sets are available--you've already done that before calling here!
//there is also defense in depth below, as the table's unique indices will make trying to add a duplicate row throw an error
async function name_set({userTag, name0, name1, name2}) {
	checkTag(userTag); checkName({f0: name0, f1: name1, f2: name2})
	await name_delete({userTag})//replace an existing row about this user with a new one:
	await queryAddRow({table: 'name_table', row: {user_tag: userTag, name0_text: name0, name1_text: name1, name2_text: name2}})
}

//remove a user's route and name information, to hide or delete the user, freeing the user's route and page name for another person to take after this
async function name_delete({userTag, hideSet}) {//hide reason code optional
	checkTag(userTag);
	await queryHide('name_table', {user_tag: userTag}, {hideSet})
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
//ttd february2025, make profile_table

SQL(`
-- stuff on the user's profile page that doesn't need to be unique or indexed
CREATE TABLE profile_table (
	row_tag       CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick      BIGINT    NOT NULL,
	hide          BIGINT    NOT NULL,

	user_tag      CHAR(21)  NOT NULL,
	profile_text  TEXT      NOT NULL   -- printed object so you can add properties without changing schema; you never need to index by one
);

`)











//                      _            _        _     _      
//  ___  ___ _ ____   _(_) ___ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ '__\ \ / / |/ __/ _ \ | __/ _` | '_ \| |/ _ \
// \__ \  __/ |   \ V /| | (_|  __/ | || (_| | |_) | |  __/
// |___/\___|_|    \_/ |_|\___\___|  \__\__,_|_.__/|_|\___|
//                                                         

//service_table, complete record of our interactions with third-party services, to instrument them, and later, round robin them

SQL(`
-- are these third party services working properly, and helping users complete high-level tasks quickly and reliably?
CREATE TABLE service_table (
	row_tag        CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick       BIGINT    NOT NULL,
	hide           BIGINT    NOT NULL,

	-- about the user and what they started or finished
	browser_hash   CHAR(52)  NOT NULL,
	user_tag       CHAR(21)  NOT NULL,
	event_text     TEXT      NOT NULL,

	-- about the address, if one is involved, like email or phone or credit card
	type_text      TEXT      NOT NULL,
	address0_text  TEXT      NOT NULL,
	address1_text  TEXT      NOT NULL,
	address2_text  TEXT      NOT NULL,

	-- about the third party service provider, what we told them, their response or what happened right now
	provider_text  TEXT      NOT NULL,
	service_text   TEXT      NOT NULL,
	request_text   TEXT      NOT NULL,
	response_text  TEXT      NOT NULL,
	error_text     TEXT      NOT NULL,

	-- and space for additional notes
	note1_text     TEXT      NOT NULL,
	note2_text     TEXT      NOT NULL,
	note3_text     TEXT      NOT NULL
);

CREATE INDEX service1 ON service_table (hide, user_tag,                 row_tick DESC);
CREATE INDEX service2 ON service_table (hide, type_text, address0_text, row_tick DESC);
`)
/*
here's where you record what you send apis, and what you got back
and how fast they are, how reliable they are
how quickly users can complete tasks with them, all of that leads into robin
(^wrote that much earlier, just as part of naming service_table)

ttd october2025, notes about service_table, AUDIT logs, and the round Robin system
this is just a rought sketch; you made this table but don't have any code that writes to it yet

this table is more like a log or a data lake than the others
you can start making records here long before there's a round robin system that uses it in real time
and before that, a staff page that shows twilio is faster than amazon or the reverse will query from here

you'd prefer tables only have user tag, not that and browser hash, but suspect there will be records right before a person at a browser gets a user tag, or something
you suspect you'll  need
you added browser hash and user tag

event_text should be a tag like "Challenged.", "Validated." and so on
ideally the event will be at the user-level, like the user started or completed some task they understand
but maybe some of these will also need to drop down to a lower level where it's just about something between the worker and provider

like all the tables, the design idea is to keep this granular
if the provider never responds, that'll be one record without a second record

added two indexes as a starting point but you have no idea how you'll query this
and only queries that load to a user interaction, like avoiding a emailer that broke an hour ago, need to be fast
*/

//ttd october2025, where you are currently logging to datadog as an AUDIT, also write here











//           _   _   _                   _        _     _      
//  ___  ___| |_| |_(_)_ __   __ _ ___  | |_ __ _| |__ | | ___ 
// / __|/ _ \ __| __| | '_ \ / _` / __| | __/ _` | '_ \| |/ _ \
// \__ \  __/ |_| |_| | | | | (_| \__ \ | || (_| | |_) | |  __/
// |___/\___|\__|\__|_|_| |_|\__, |___/  \__\__,_|_.__/|_|\___|
//                           |___/                             

SQL(`
-- settings for the application as a whole
CREATE TABLE settings_table (
	row_tag             CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick            BIGINT    NOT NULL,
	hide                BIGINT    NOT NULL,  -- standard starting three present for consistancy, but not used

	setting_name_text   TEXT      NOT NULL,  -- the name of the setting kept by this row
	setting_value_text  TEXT      NOT NULL   -- the value of that named setting, you have to store a number as text
);

CREATE UNIQUE INDEX settings1 ON settings_table (setting_name_text) WHERE hide = 0;  -- among visible rows, setting names must be unique
`)

export async function settingReadInt(name, defaultValue) {
	return textToInt(await settingRead(name, defaultValue))
}
export async function settingRead(name, defaultValue) {
	let defaultValueText = defaultValue+''
	checkText(name); checkTextOrBlank(defaultValueText)
	let rows = await queryGet('settings_table', {setting_name_text: name})
	let row = rows[0]//unique index guarantees 0 or 1 visible rows per setting name
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

export async function trailRecent(message) {
	checkText(message)
	let hash = await hashText(message)
	let row = await queryTop({table: 'trail_table', title: 'hash', cell: hash})
	return row ? row.row_tick : 0
}
export async function trailCount(message, horizon) {
	checkText(message); checkInt(horizon, 1)
	let hash = await hashText(message)
	return await queryCountSince({table: 'trail_table', title: 'hash', cell: hash, since: Now() - horizon})
}
export async function trailGet(message, horizon) {
	checkText(message); checkInt(horizon, 1)
	let hash = await hashText(message)
	return await queryGet('trail_table', {hash}, {since: Now() - horizon})
}
export async function trailAdd(message) { return await trailAddMany([message]) }
export async function trailAddMany(a) {//use like trailAddMany([message1, message2])
	a.forEach(checkText)//call checkText on each message in a
	let now = Now()
	let rows = await Promise.all(a.map(async message => ({row_tick: now, hash: await hashText(message)})))
	await queryAddRows({table: 'trail_table', rows})
}
grid(async () => {//trail: count, get, and recent all respect horizon
	let message = 'Trail test', horizon = 20*Time.second
	ok((await trailCount(message, horizon)) == 0)//none yet
	ok((await trailGet(message, horizon)).length == 0)
	ok((await trailRecent(message)) == 0)//not found returns 0

	await trailAdd(message)
	let first = await trailRecent(message)//tick of first add
	ok((await trailCount(message, horizon)) == 1)//find one
	ok((await trailGet(message, horizon)).length == 1)

	ageNow(10*Time.second)
	await trailAdd(message)//add a second, 10s after first
	let second = await trailRecent(message)//tick of second add
	ok(second > first)//second is more recent
	ok((await trailCount(message, horizon)) == 2)//find both
	ok((await trailGet(message, horizon)).length == 2)

	ageNow(15*Time.second)//first one falls over horizon (now 25s old)
	ok((await trailCount(message, horizon)) == 1)//only more recent remains
	ok((await trailGet(message, horizon)).length == 1)
	ok((await trailRecent(message)) == second)//recent still returns the second add
})
grid(async () => {
	await trailAddMany(['1 of 2', '2 of 2'])//add two messages at once, they're hashed simultaenously and added in a single query
	ok((await trailCount('1 of 2', Time.minute)) == 1)
	ok((await trailCount('2 of 2', Time.minute)) == 1)
})

SQL(`
-- a thing that may be happening recently, is it too late? too soon? too frequent?
CREATE TABLE trail_table (
	row_tag   CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick  BIGINT    NOT NULL,
	hide      BIGINT    NOT NULL,  -- not used, in the future we might hide old rows, or actually delete them!

	hash      CHAR(52)  NOT NULL   -- the hash of the message about the event that happened on row tick
);

CREATE INDEX trail1 ON trail_table (hide,       row_tick DESC);  -- hide or delete old rows quickly
CREATE INDEX trail2 ON trail_table (hide, hash, row_tick DESC);  -- get time sorted rows by hash
`)

//                        _        _     _      
//  _   _ ___  ___ _ __  | |_ __ _| |__ | | ___ 
// | | | / __|/ _ \ '__| | __/ _` | '_ \| |/ _ \
// | |_| \__ \  __/ |    | || (_| | |_) | |  __/
//  \__,_|___/\___|_|     \__\__,_|_.__/|_|\___|
//                                              

SQL(`
-- does this user exist? have they finished signing up? are they a creator? are they staff? is their account hidden or closed?
CREATE TABLE user_table (
	row_tag       CHAR(21)  NOT NULL PRIMARY KEY,
	row_tick      BIGINT    NOT NULL,
	hide          BIGINT    NOT NULL,

	user_tag      CHAR(21)  NOT NULL,
	stage         BIGINT    NOT NULL   -- 0 not used, 1 provisional, 2 normal, 
);

-- here is where you figure out, in this table? in the same column?
-- provisional/normal
-- creator/fan
-- normal/staff/god
-- visible/hidden by user; /hidden by staff; suspended, like not deleted, but user can't change; and unhidden
-- closed by user/by staff; and unclosed?


`)
























//what user, if any, is at the given browser?
export async function browserToUser({browserHash}) {
	checkHash(browserHash)
	let user = {browserHash}
	let u = await browser_get({browserHash})//always does this one query to be fast
	if (u) {
		user.userTag = u.userTag
		user.level = u.level

		if (user.userTag) {//we found a user tag, let's look up its name and more information about it
			let n = await name_get({userTag: user.userTag})
			if (n) {
				user.name = bundleValid({f0: n.name0, f1: n.name1, f2: n.name2})
			}
		}
	}
	return user
}






export async function demonstrationSignGet({browserHash}) {
	checkHash(browserHash)

	let b = await browser_get({browserHash})//look for a user at the given browser
	if (b) {
		let n = await name_get({userTag: b.userTag})//find that user's name, right now their normalized route identifies them
		if (n) {
			return {isFound: true, browserHash, userTag: b.userTag, name0: n.name0, name1: n.name1, name2: n.name2}
		}
	}
	return {isFound: false, browserHash}
}
export async function demonstrationSignUp({browserHash, name0, origin}) {
	checkHash(browserHash); checkName({f0: name0})

	let n = await name_get({name0})//confirm route is available in database
	if (n) return {isSignedUp: false, reason: 'NameTaken.', browserHash, name0}

	let userTag = Tag()//create a new user, making the unique tag that will identify them
	await name_set({userTag, name0, name1: name0, name2: name0})//ttd january2025, all the same for now
	await browser_in({browserHash, userTag, level: 2, origin})//and sign the new user into the requesting browser, in our records
	return {isSignedUp: true, browserHash, userTag, name: name0, name0}//just for testing; we won't send user tags to pages
}
export async function demonstrationSignIn({browserHash, name0, origin}) {
	checkHash(browserHash); checkName({f0: name0})

	let n = await name_get({name0})//in this early simplification before user_table, a user exists by their tag with a route
	if (!n) return {isSignedIn: false, reason: 'NameUnknown.', browserHash, name0}

	await browser_in({browserHash, userTag: n.userTag, level: 2, origin})//and sign the new user into the requesting browser, in our records
	return {isSignedIn: true, browserHash, userTag: n.userTag, name: name0, name0}//just for testing; we won't send user tags to pages
}
export async function demonstrationSignOut({browserHash, origin}) {
	checkHash(browserHash)

	let u = await demonstrationSignGet({browserHash})
	if (u.isFound) {
		await browser_out({browserHash, userTag: u.userTag, hideSet: 2, origin})//hide set 2 meaning at user's click we did this
		return {isSignedOut: true, browserHash, userTag: u.userTag}
	} else {
		return {isSignedOut: false, reason: 'NameNotFound.', browserHash}
	}
}
