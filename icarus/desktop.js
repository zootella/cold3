
import {
Now, log, look, toss, test, ok,
checkInt, checkText, checkTextOrBlank,
intToText, textToInt,
checkHash, checkSquare,
Data, subtleHash,
} from './level0.js'
import {
Tag, checkTag,
} from './level1.js'
import {
getAccess,
} from './level2.js'

import {createClient} from '@supabase/supabase-js'










//these are ready for level3, specific to the application

/*
this sitting goal: get all current database use factored through generalized functions
then tonight you can go on a notes and previous scraps deleteathon
*/

export async function database_hit() {
	/*
	let r = await database_addRow({table: 'example_table', row: {
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
export async function accessTableInsert(browserTag, signedIn) {
	database_addRow({table: 'access_table', row: {row_tick: Now(), row_tag: Tag(), browser_tag: browserTag, signed_in: signedIn}})
}
//query table_access to get all the rows with a matching browser tag
export async function accessTableQuery(browserTag) {
	let rows = await database_getRows({table: 'access_table', title: 'browser_tag', cell: browserTag, titleSort: 'row_tick'})
	return rows
}

export async function countGlobal_rowExists() {
	let hits = await database_countRows({table: 'settings_table', title: 'setting_name_text', cell: 'hits'})
	return hits > 0
}
export async function countGlobal_createRow() {
	await database_addRow({table: 'settings_table', row: {setting_name_text: 'hits', setting_value_text: '0'}})
}
export async function countGlobal_readRow() {//returns the count
	let row = await database_getRow({table: 'settings_table', title: 'setting_name_text', cell: 'hits'})
	return row.setting_value_text
}
export async function countGlobal_writeRow(newValue) {
	await database_updateCell({table: 'settings_table', titleFind: 'setting_name_text', cellFind: 'hits', titleSet: 'setting_value_text', cellSet: newValue})
	log('incremented')
}























//getting this ready for level2, specific to supabase but not the application above

//      _       _        _                    
//   __| | __ _| |_ __ _| |__   __ _ ___  ___ 
//  / _` |/ _` | __/ _` | '_ \ / _` / __|/ _ \
// | (_| | (_| | || (_| | |_) | (_| \__ \  __/
//  \__,_|\__,_|\__\__,_|_.__/ \__,_|___/\___|
//                                            

//create the supabase client to talk to the cloud database
let _real, _test
async function realDatabase() {
	if (!_real) {
		let access = await getAccess()
		_real = createClient(access.get('ACCESS_SUPABASE_REAL1_URL'), access.get('ACCESS_SUPABASE_REAL1_KEY_SECRET'))
	}
	return _real
}
async function testDatabase() {
	if (!_test) {
		let access = await getAccess()
		_test = createClient(access.get('ACCESS_SUPABASE_TEST1_URL'), access.get('ACCESS_SUPABASE_TEST1_KEY_SECRET'))
	}
	return _test
}

//                              
//   __ _ _   _  ___ _ __ _   _ 
//  / _` | | | |/ _ \ '__| | | |
// | (_| | |_| |  __/ |  | |_| |
//  \__, |\__,_|\___|_|   \__, |
//     |_|                |___/ 

/*
[]rename to like:

queryDeleteRow - delete one row if it meets the specified criteria
queryDeleteRows - delete all rows that meet the specified criteria
querySetCell - change an existing cell to a new value
queryAddRows - add several at once
queryAddRow - add just one of them; these do all the checks first before leading to the same helper
queryCountRows - return the number of rows that meet specified criteria
queryGetRows - get all of them, sorted
queryGetPage - just the desired number, sorted by given title, have limit and offset
queryGetSingleRow - use when you know there's zero or one
queryGetRecentRow - use when there could be many


queryAddRow – Insert a single new row.
queryAddRows – Insert multiple new rows in bulk.
querySetCell – Update a single column in exactly one row.
querySetCells - update all the cells in a column, like setting their hide to 1
queryUpdateRow – Update multiple columns in exactly one row.
queryUpdateRows – Update one or more columns across all matching rows.
queryDeleteRow – Delete exactly one row matching specified criteria.
queryDeleteRows – Delete all rows matching specified criteria.
queryCountRows – Return the number of rows matching a condition.
queryGetRows – Retrieve all matching rows, possibly filtered, sorted.
queryGetNRows – Retrieve a limited set of matching rows, sorted.
queryGetSingleRow – Retrieve a unique row (or none) matching some condition.
queryGetRecentRow – Retrieve the most recent row (or a small set), usually by a time/tick column.
queryExists – Return a boolean indicating if any row matches a given condition. (Optional but common)



you'll need a page, database test
and three buttons, Populate, Query, and Clear
yeah, this is a good idea, but don't spend more than a day on it






*/

//in table, look at column title, and count how many rows have the given cell value
export async function database_countRows({table, title, cell}) {
	checkQueryTitle(table); checkQueryCell(title, cell)
	let database = await realDatabase()
	let {count, error} = (await database
		.from(table)
		.select(title, {count: 'exact'})//count exact matches based on title
		.eq(title, cell))//filter rows to those with the cell value
	if (error) toss('supabase', {error})
	return count
}

//add a new row to table like {title1_text: "cell1", title2_text: "cell2", ...}
export async function database_addRow({table, row}) {
	checkQueryTitle(table); checkQueryRow(row)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.insert([row]))//order of properties doesn't matter
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at titleFind to find one row with value cellFind, then go right to column titleSet, and write cellSet there
export async function database_updateCell({table, titleFind, cellFind, titleSet, cellSet}) {
	checkQueryTitle(table); checkQueryCell(titleFind, cellFind); checkQueryCell(titleSet, cellSet)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.update({[titleSet]: cellSet})//write cellSet in column titleSet
		.eq(titleFind, cellFind))//in the row where titleFind equals cellFind
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column title to find one row with value cell, and get the whole row like {title1_text: "cell1", title2_text: "cell2"}
export async function database_getRow({table, title, cell}) {
	checkQueryTitle(table); checkQueryCell(title, cell)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to get the whole row
		.eq(title, cell)//find the row where title equals cell
		.single())//if no rows match returns data as null, if 2+ rows match returns error
	if (error) toss('supabase', {error})
	return data//data is the whole row
}

//in table, look at column title to get all the rows with cell value, and get them biggest to smallest based on the cells below titleSort
export async function database_getRows({table, title, cell, titleSort}) {
	checkQueryTitle(table); checkQueryCell(title, cell); checkQueryTitle(titleSort)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(title, cell)//filter to get rows where title equals cell
		.order(titleSort, {ascending: false}))//sort rows by titleSort in descending order
	if (error) toss('supabase', {error})
	return data//data is an array of objects like [{'row_tag': 'nW83MrWposHNSsZxOjO03', ...}, {}, ...]
}

//                                     _               _    
//   __ _ _   _  ___ _ __ _   _    ___| |__   ___  ___| | __
//  / _` | | | |/ _ \ '__| | | |  / __| '_ \ / _ \/ __| |/ /
// | (_| | |_| |  __/ |  | |_| | | (__| | | |  __/ (__|   < 
//  \__, |\__,_|\___|_|   \__, |  \___|_| |_|\___|\___|_|\_\
//     |_|                |___/                             

function checkQueryTitle(title) {//make sure the given title looks ok as a table name or column title
	if (!isQueryTitle(title)) toss('check title', {title, cell})
}
function checkQueryRow(row) {//check a row like {"name_text": "bob", "hits": 789}
	for (let [title, cell] of Object.entries(row)) checkQueryCell(title, cell)
}
function checkQueryCell(title, cell){//in a column with the given title, check the value in a cell
	if (!isQueryTitle(title)) toss('check title', {title, cell})
	let type = _type(title)
	if      (type == 'tag')  { if (!isQueryTag(cell))  toss('check tag',  {title, cell}) }
	else if (type == 'hash') { if (!isQueryHash(cell)) toss('check hash', {title, cell}) }
	else if (type == 'text') { if (!isQueryText(cell)) toss('check text', {title, cell}) }
	else                     { if (!isQueryInt(cell))  toss('check int',  {title, cell}) }
}
function _type(s) {//from a column title like "name_type", clip out "type"
	let i = s.lastIndexOf('_')
	return i == -1 ? s : s.slice(i + 1)//return whole thing if not found
}

//these simple and nearby functions keep us safe from making a bad query or storing bad data
function isQueryText(s) {//text must be a string, can be blank, can contain weird characters
	return typeof s == 'string'
}
function isQueryTitle(s) {//table names and column titles are like "some_name_text"
	return typeof s == 'string' && s.length > 0 && /^[a-z](?:[a-z0-9_]*[a-z0-9])?$/.test(s)
}
function isQueryTag(s) {//a tag must be 21 letters and numbers
	return typeof s == 'string' && s.length == 21 && /^[A-Za-z0-9]+$/.test(s)
}
function isQueryHash(s) {//a sha256 hash value in base32 without padding is 52 A-Z and 2-7
	return typeof s == 'string' && s.length == 52 && /^[A-Z2-7]+$/.test(s)
}
function isQueryInt(i) {//make sure i is an integer within range, negative is fine
	return (
		i === 0//let zero through quickly
	) || (
		Number.isInteger(i)          &&//covers typeof, isNaN, isFinite, and Math.floor checks
		i >= Number.MIN_SAFE_INTEGER &&//BIGINT's range is 2^63, wider than JavaScript's 2^53
		i <= Number.MAX_SAFE_INTEGER &&
		/^-?[1-9]\d*$/.test(i+'')//and make sure it looks like an integer as text
	)
}
test(() => {
	checkQueryRow({
		'name_text': 'bob',
		'optional_text': '',
		'count': 7,
		'some_tag': 'yz5OjTi1aeD4YnEM47gUD',
		'some_hash': 'VNTDBXDMLKBBT7YICWOHGYE2DKIM7HND55KNAMXXFOWUYAK6CXJQ',
		'preference': -1,
	})
})
test(() => {
	checkQueryCell('browser_tag', '5WWs2JIIZQZ6UFJj2bHH2')
	checkQueryCell('password_hash', '2KJNI2IKXJPFHUGIUZRAB4AN7WD4OJUY7OWUGGYB3CQ75AD4MBNQ')
	checkQueryCell('name_text', 'bob')//because column title ends "_text" cell value must be a string
	checkQueryCell('name_text', '')//blank is ok
	checkQueryCell('count', 7)//without a type suffix in the title, the cell must hold an integer
})
test(() => {
	ok(_type('name_text') == 'text')
	ok(_type('other') == 'other')
	ok(_type('longer_name_hash') == 'hash')
})
test(() => {

	//text in a cell in the database can be blank
	ok(isQueryText('hi'))
	ok(isQueryText(''))
	//text can't be nothing or a non-string, though
	ok(!isQueryText())
	ok(!isQueryText(0))
	ok(!isQueryText(null))

	//table names and column titles are like "name" or "some_longer_name"
	ok(isQueryTitle('name'))
	ok(isQueryTitle('some_longer_name'))
	//titles can't be blank, or have spaces or even uppercase letters, by our convention
	ok(!isQueryTitle(''))
	ok(!isQueryTitle('has space'))
	ok(!isQueryTitle('Title_Case'))
	//underscores are fine
	ok(isQueryTitle('a'))
	ok(isQueryTitle('a_b'))
	ok(isQueryTitle('a__b'))
	//except not at the start or end
	ok(!isQueryTitle('_'))
	ok(!isQueryTitle('a_'))
	ok(!isQueryTitle('_b'))
	//digits are fine, but not at the start
	ok(isQueryTitle('name2_text'))
	ok(isQueryTitle('a2'))
	ok(!isQueryTitle('2b'))
	ok(!isQueryTitle('2'))

	//there are lots of tags in the database; they must be 21 letters or numbers
	ok(!isQueryTag(''))
	ok(!isQueryTag('f26mjatF7WxmuXjv0Iid'))//too short
	ok( isQueryTag('f26mjatF7WxmuXjv0Iid0'))//looks good
	ok(!isQueryTag('f26mjatF7WxmuXjv0Ii_0'))//invalid character
	ok(!isQueryTag('f26mjatF7WxmuXjv0Iid0a'))//too long

	//hashes in the database are also common; we're using sha256 and base32 without padding
	ok(!isQueryHash(''))
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3E'))//too short
	ok( isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA'))//looks good
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO38A'))//invalid character
	ok(!isQueryHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA2'))//too long

	//negative integers are fine in the database
	ok(isQueryInt(0))
	ok(isQueryInt(-500))
	ok(isQueryInt(1737493381245))
	ok(!isQueryInt())
	ok(!isQueryInt(''))
	ok(!isQueryInt(null))
	ok(!isQueryInt(2.5))
	//chat suggested 012 decimal, which is just 10
	//strict mode blocks code with negative decimal like -09
	//negative zero literal, -0, makes it through, but -0+'' is "0"
	//and more importantly there is no negative 0 in PostgreSQL's BIGINT; one would get stored as regular zero
})


























