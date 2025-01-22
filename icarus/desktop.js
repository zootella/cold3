
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



















//in table, look at column title, and count how many rows have the given cell value
export async function database_countRows({table, title, cell}) {
	checkTitle(table); checkCell(title, cell)
	let database = await realDatabase()
	let {count, error} = (await database
		.from(table)
		.select(title, {count: 'exact'})//count exact matches based on title
		.eq(title, cell))//filter rows to those with the cell value
	if (error) toss('supabase', {error})
	return count
}

//to table add a new row like {title1_text: "cell1", title2_text: "cell2", ...}
export async function database_addRow({table, row}) {
	checkTitle(table); checkRow(row)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.insert([row]))//order of properties doesn't matter
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at titleFind to find one row with value cellFind, then go right to column titleSet, and write cellSet there
export async function database_updateCell({table, titleFind, cellFind, titleSet, cellSet}) {
	checkTitle(table); checkCell(titleFind, cellFind); checkCell(titleSet, cellSet)
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
	checkTitle(table); checkCell(title, cell)
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
	checkTitle(table); checkCell(title, cell); checkTitle(titleSort)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(title, cell)//filter to get rows where title equals cell
		.order(titleSort, {ascending: false}))//sort rows by titleSort in descending order
	if (error) toss('supabase', {error})
	return data//data is an array of objects like [{'row_tag': 'nW83MrWposHNSsZxOjO03', ...}, {}, ...]
}

//ttd january, probably have one which gets not one row, not all rows sorted, rather the greatest tick row, that one row

//and then the idea here is, you keep on adding generalized functions, even if each is quite specific to a new type of query you want to do
















function checkTitle(title) {//check title looks to name a table or column title
	if (!isTitle(title)) toss('check title', {title, cell})
}
function checkRow(row) {//checks row like {"name_text": "bob", "hits": 789}
	for (let [title, cell] of Object.entries(row)) checkCell(title, cell)
}
function checkCell(title, cell){//column title and value in a cell beneath that title
	if (!isTitle(title)) toss('check title', {title, cell})
	let type = titleType(title)
	if      (type == 'tag')  { if (!isTag(cell))  toss('check tag',  {title, cell}) }
	else if (type == 'hash') { if (!isHash(cell)) toss('check hash', {title, cell}) }
	else if (type == 'text') { if (!isText(cell)) toss('check text', {title, cell}) }
	else                     { if (!isInt(cell))  toss('check int',  {title, cell}) }
}
function titleType(s) {//from a column title like 'name_type', clip out 'type'
	let i = s.lastIndexOf('_')
	return i == -1 ? s : s.slice(i + 1)
}
//these simple and nearby functions keep us safe from making a bad query or storing bad data
function isText(s) {//text must be a string, can be blank, can contain weird characters
	return typeof s == 'string'
}
function isTitle(s) {//table names and column titles are like "some_name_text"
	return typeof s == 'string' && s.length > 0 && /^[a-z](?:[a-z0-9_]*[a-z0-9])?$/.test(s)
}
function isTag(s) {//a tag must be 21 letters and numbers
	return typeof s == 'string' && s.length == 21 && /^[A-Za-z0-9]+$/.test(s)
}
function isHash(s) {//a sha256 hash value in base32 without padding is 52 A-Z and 2-7
	return typeof s == 'string' && s.length == 52 && /^[A-Z2-7]+$/.test(s)
}
function isInt(i) {//make sure i is an integer within range, negative is fine
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
	checkRow({
		'name_text': 'bob',
		'optional_text': '',
		'count': 7,
		'some_tag': 'yz5OjTi1aeD4YnEM47gUD',
		'some_hash': 'VNTDBXDMLKBBT7YICWOHGYE2DKIM7HND55KNAMXXFOWUYAK6CXJQ',
		'preference': -1,
	})
})
test(() => {
	checkCell('browser_tag', '5WWs2JIIZQZ6UFJj2bHH2')
	checkCell('password_hash', '2KJNI2IKXJPFHUGIUZRAB4AN7WD4OJUY7OWUGGYB3CQ75AD4MBNQ')
	checkCell('name_text', 'bob')//because column title ends "_text" cell value must be a string
	checkCell('name_text', '')//blank is ok
	checkCell('count', 7)//without a type suffix in the title, the cell must hold an integer
})
test(() => {
	ok(titleType('name_text') == 'text')
	ok(titleType('other') == 'other')
	ok(titleType('longer_name_hash') == 'hash')
})
test(() => {

	//text in a cell in the database can be blank
	ok(isText('hi'))
	ok(isText(''))
	//text can't be nothing or a non-string, though
	ok(!isText())
	ok(!isText(0))
	ok(!isText(null))

	//table names and column titles are like "name" or "some_longer_name"
	ok(isTitle('name'))
	ok(isTitle('some_longer_name'))
	//titles can't be blank, or have spaces or even uppercase letters, by our convention
	ok(!isTitle(''))
	ok(!isTitle('has space'))
	ok(!isTitle('Title_Case'))
	//underscores are fine
	ok(isTitle('a'))
	ok(isTitle('a_b'))
	ok(isTitle('a__b'))
	//except not at the start or end
	ok(!isTitle('_'))
	ok(!isTitle('a_'))
	ok(!isTitle('_b'))
	//digits are fine, but not at the start
	ok(isTitle('name2_text'))
	ok(isTitle('a2'))
	ok(!isTitle('2b'))
	ok(!isTitle('2'))

	//there are lots of tags in the database; they must be 21 letters or numbers
	ok(!isTag(''))
	ok(!isTag('f26mjatF7WxmuXjv0Iid'))//too short
	ok( isTag('f26mjatF7WxmuXjv0Iid0'))//looks good
	ok(!isTag('f26mjatF7WxmuXjv0Ii_0'))//invalid character
	ok(!isTag('f26mjatF7WxmuXjv0Iid0a'))//too long

	//hashes in the database are also common; we're using sha256 and base32 without padding
	ok(!isHash(''))
	ok(!isHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3E'))//too short
	ok( isHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA'))//looks good
	ok(!isHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO38A'))//invalid character
	ok(!isHash('3LZ6DTMBR2LHVN66AF4I2UU3BK5NFMZEVPH5UWEF3O7A3PMGO3EA2'))//too long

	//negative integers are fine in the database
	ok(isInt(0))
	ok(isInt(-500))
	ok(isInt(1737493381245))
	ok(!isInt())
	ok(!isInt(''))
	ok(!isInt(null))
	ok(!isInt(2.5))
	//chat suggested 012 decimal, which is just 10
	//strict mode blocks code with negative decimal like -09
	//negative zero literal, -0, makes it through, but -0+'' is "0"
	//and more importantly there is no negative 0 in PostgreSQL's BIGINT; one would get stored as regular zero
})


























