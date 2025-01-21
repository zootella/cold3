
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

what should the object structure be for rows?
does order matter? it does in postgres--is this all relying on order within an object?
*/


export async function database_hit() {

	let r = await database_addRow({table: 'example_table', row: {
		row_tag: Tag(),
		row_tick: Now(),
		hide: 0,
		name_text: 'missing hits',
		some_hash: 'J3K3TYOGOWVONV7ZLOUPPJWBSYRTCFHHFCEURQZQIMQEMKVOJ2SQ',
	}})


	log(look(r))
}
/*
-- example table showcasing conventions and types
CREATE TABLE example_table (
	row_tag    CHAR(21)  PRIMARY KEY  NOT NULL, -- unique identifier of this row
	row_tick   BIGINT                 NOT NULL, -- when this row was made
	hide       BIGINT                 NOT NULL, -- nonzero when this row is no longer applicable
	name_text  TEXT                   NOT NULL, -- a name as an example of text, can be blank
	hits       BIGINT                 NOT NULL, -- a number as an example of an integer
	some_hash  CHAR(52)               NOT NULL  -- a hash value
);

third  name
*/


	/*
	let row = await database_getRow('settings_table', 'key_text', 'count')
	log(look(row))
	*/
	/*
	{
		key_text: "count"
		value_text: "1119"
	}
	*/

	/*
	bookmark january
	next, run below to see how it gives you multiple rows

	let row = await database_getRows('access_table', 'browser_tag', 'mUI301FUXDWTtgwq4eSGz')
	log(look(row))
	*/
//ttd january, so what you want is for table to identify the database to connect to, and to check that row has all the rows necessary--already, from their column titles, we can check teh types, which is great


//in table, look at column, and count how many rows have value
export async function database_countRows({table, column, value}) {
	checkCell(column, value)
	let database = await realDatabase()
	let {count, error} = (await database
		.from(table)
		.select(column, {count: 'exact'})//count exact matches based on column
		.eq(column, value))//filter rows to those with value
	if (error) toss('supabase', {error})
	return count
}

//to table add a new row like {column1_text: "value1", column2_text: "value2", ...}
export async function database_addRow({table, row}) {
	checkRow(row)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.insert([row]))//order of properties doesn't matter
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at columnFind to find one row with valueFind, then go right to columnSet, and write valueSet there
export async function database_updateCell({table, columnFind, valueFind, columnSet, valueSet}) {
	checkCell(columnFind, valueFind); checkCell(columnSet, valueSet)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.update({[columnSet]: valueSet})//write valueSet in columnSet
		.eq(columnFind, valueFind))//in the row where columnFind equals valueFind
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column to find one row with value, and get the whole row like {column1_text: "value1", column2_text: "value2"}
export async function database_getRow({table, column, value}) {
	checkCell(column, value)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to get the whole row
		.eq(column, value)//find the row where column equals value
		.single())//if no rows match returns data as null, if 2+ rows match returns error
	if (error) toss('supabase', {error})
	return data//data is the whole row
}

//in table, look at column to get all the rows with value1, and get them biggest to smallest based on their values in columnSort
export async function database_getRows({table, column, value, columnSort}) {
	checkCell(column, value); checkText(columnSort)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(column, value)//filter to get rows where column equals value
		.order(columnSort, {ascending: false}))//sort rows by columnSort in descending order
	if (error) toss('supabase', {error})
	return data//data is an array of objects like [{'row_tag': 'nW83MrWposHNSsZxOjO03', ...}, {}, ...]
}


//and then the idea here is, you keep on adding generalized functions, even if each is quite specific to a new type of query you want to do





	//ttd january, so what you want is for table to identify the database to connect to, and to check that row has all the rows necessary--already, from their column titles, we can check teh types, which is great
















/*
simple and powerful design goals:
1 high level functions that are operation, but not table, specific
2 schema object that identifies database and table, alongside commented create command for table and index
3 column titles that indicate type
and these last two are how the function validates data going into a table
*/


/*
not sure you need the schema reflected; the current design is working well
also, if you name a column that doesn't exist, or add an incomplete row, supabase will throw because of the not null everywhere
instead, just keep the sql that defines all the tables here in the code, to refer back to it
*/


export function settings_table() {
	return ['key_text', 'value_text']
}
/*
-- settings for the application as a whole
CREATE TABLE settings_table (
	key_text    TEXT  PRIMARY KEY  NOT NULL, -- name of the setting
	value_text  TEXT               NOT NULL  -- value, text or numerals
);
*/

export function example_table() {
	return ['row_tag', 'row_tick', 'hide', 'name_text', 'hits', 'some_hash']
}
/*
-- example table showcasing conventions and types
CREATE TABLE example_table (
	row_tag    CHAR(21)  PRIMARY KEY  NOT NULL, -- unique identifier of this row
	row_tick   BIGINT                 NOT NULL, -- when this row was made
	hide       BIGINT                 NOT NULL, -- nonzero when this row is no longer applicable
	name_text  TEXT                   NOT NULL, -- a name as an example of text, can be blank
	hits       BIGINT                 NOT NULL, -- a number as an example of an integer
	some_hash  CHAR(52)               NOT NULL  -- a hash value
);
*/

export function access_table() {
	return ['row_tag', 'row_tick', 'hide', 'browser_tag', 'signed_in']
}
/*
-- record of browsers signing in and out
CREATE TABLE access_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL, -- unique identifier of this row
	row_tick     BIGINT                 NOT NULL, -- when this row was made
	hide         BIGINT                 NOT NULL, -- nonzero as a reason this row is no longer applicable
	browser_tag  CHAR(21)               NOT NULL, -- the browser signing in or out
	signed_in    BIGINT                 NOT NULL  -- 1 signed in, 0 signed back out
);
*/

export function hits_table() {
	return ['row_tag', 'row_tick', 'hide', 'browser_tag', 'hits']
}
/*
-- record of each browser's hit counter
CREATE TABLE hits_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL, -- unique identifier of this row
	row_tick     BIGINT                 NOT NULL, -- when this row was made
	hide         BIGINT                 NOT NULL, -- nonzero as a reason this row is no longer applicable
	browser_tag  CHAR(21)               NOT NULL, -- tag identifying the browser
	hits         BIGINT                 NOT NULL  -- that browser's personal incrementable hit counter
);
*/




function checkRow(row) {//object of column names: cell contents
	for (let [column, value] of Object.entries(row)) checkCell(column, value)
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
/*
^this is the row format you want, you think
but what row format does the supabase api give you?
*/
function checkCell(column, value){//column name and value in a cell beneath that column
	checkText(column)//value can be blank, but column title cannot
	let type = _type(column)
	if      (type == 'tag')  { checkTag(value)         }//a tag, 21 letters and numbers
	else if (type == 'hash') { checkHash(value)        }//a sha256 hash value encoded to base32, 52 characters
	else if (type == 'text') { checkTextOrBlank(value) }//text, can be blank
	else                     { /*checkInt(value)  ttd january*/       }
}
test(() => {
	checkCell('browser_tag', '5WWs2JIIZQZ6UFJj2bHH2')
	checkCell('password_hash', '2KJNI2IKXJPFHUGIUZRAB4AN7WD4OJUY7OWUGGYB3CQ75AD4MBNQ')
	checkCell('name_text', 'bob')//because column title ends "_text" value must be a string
	checkCell('name_text', '')//blank is ok
	checkCell('count', 7)//without a type suffix in the title, value must be an integer
})
function _type(s) {//from a column name like 'name_type', clip out 'type'
	let i = s.lastIndexOf('_')
	if (i == -1) return s
	return s.slice(s.lastIndexOf('_') + 1)
}
test(() => {
	ok(_type('name_text') == 'text')
	ok(_type('other') == 'other')
	ok(_type('longer_name_hash') == 'hash')
})

function checkDatabaseText(s)  { if (!isText(s)) toss('data', {s}) }
function checkDatabaseTitle(s) { if (!isTitle(s)) toss('data', {s}) }
function checkDatabaseTag(s)   { if (!isTag(s)) toss('data', {s}) }
function checkDatabaseHash(s)  { if (!isHash(s)) toss('data', {s}) }
function checkDatabaseInt(s)   { if (!isInt(s)) toss('data', {s}) }

//these simple and nearby functions keep us safe from making a bad query or storing bad data
function isText(s) {//text must be a string, can be blank, can contain weird characters
	return typeof s == 'string'
}
function isTitle(s) {//table names and column titles are like "some_name_text"
	return typeof s == 'string' && s.length > 0 && /^[a-z_]+$/.test(s)
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




















/*
what if instead you kept these very simple and very local
table names and column titles can only be a-z_ can't be blank, can't have spaces or uppercase
numbers can only be integers within javascript range, can totally be negative
(doing that here means you don't have to mess with the goodwin dragon at the lowest level)
tags and hashes have their own character and length requirements



[]switch from column to title, which is easier to type and shorter
what's the use of cell versus value, maybe cell is what you should use

table, title, cell

also what's your naming convention
table is a table name, like "example_table"
cell is a pair of a column title,




title

integer

tag

hash

text
















*/












/*
ttd january
can you rename subtleHash to hash256?
or does that mess up conventions in level0 or something?
*/


/*
this is the new katy, her niece
yes, it's correct that these aren't the same as the ones the rest of the application uses
these are simpler and lower than those, and are more sanity-check(ey); less strong
defense in depth means that we've got two sets of functions checking data
this just makes sure obvious mistake or intentional garbage doesn't make it into data records
or get used in data queries
*/












//insert a new row into table_access with the given row tag, browser hash, and signed in status
export async function accessTableInsert(browser_tag, signed_in) {
	checkTag(browser_tag)//put type checks here, you think, to be sure only good data gets inserted
	checkInt(signed_in)

	let database = await realDatabase()
	let {data, error} = (await database.from('access_table').insert([{row_tick: Now(), row_tag: Tag(), browser_tag, signed_in}]))
	if (error) toss('supabase', {error})
}
//query table_access to get all the rows with a matching browser_tag
export async function accessTableQuery(browser_tag) {
	checkTag(browser_tag)

	let database = await realDatabase()
	let { data, error } = (await database.from('access_table').select('*').eq('browser_tag', browser_tag).order('row_tick', {ascending: false}))//most recent row first
	if (error) toss('supabase', {error})
	return data
}



/*
// Four functions for the row 'count' in table 'settings_table'
// 1. Determine if the row exists
// SQL equivalent: SELECT COUNT(key_text) FROM settings_table WHERE key_text = 'count'
// 2. Create the row with starting value zero
// SQL equivalent: INSERT INTO settings_table (key_text, value_text) VALUES ('count', '0')
// 3. Read the value
// SQL equivalent: SELECT value_text FROM settings_table WHERE key_text = 'count'
// 4. Write a new value
// SQL equivalent: UPDATE settings_table SET value_text = 'newValue' WHERE key_text = 'count' RETURNING *
*/

export async function countGlobal_rowExists() {
	let database = await realDatabase()
	let {data, error, count} = (await database.from('settings_table').select('key_text', {count: 'exact'}).eq('key_text', 'count'))
	if (error) toss('supabase', {error})
	return count > 0
}
export async function countGlobal_createRow() {
	let database = await realDatabase()
	let {data, error} = (await database.from('settings_table').insert([{key_text: 'count', value_text: intToText(0)}]))
	if (error) toss('supabase', {error})
}
export async function countGlobal_readRow() {
	let database = await realDatabase()
	let {data, error} = (await database.from('settings_table').select('value_text').eq('key_text', 'count'))
	if (error) toss('supabase', {error})
	return data[0]?.value_text
}
export async function countGlobal_writeRow(newValue) {
	let database = await realDatabase()
	let {data, error} = (await database.from('settings_table').update({value_text: newValue}).eq('key_text', 'count').select())
	if (error) toss('supabase', {error})
	if (!data.length) toss('no updated rows')
}

/*
-- settings for the application as a whole
CREATE TABLE settings_table (
	key_text    TEXT  PRIMARY KEY  NOT NULL, -- name of the setting
	value_text  TEXT               NOT NULL  -- value, text or numerals, blank if none so still not null
);
*/



/*
facts about postgres and choices about how we're using it:
we're using BIGINT for every integer, for simplicity, even if we only plan on storing 0 or 1
indices make queries much faster, and compound indices that match queries are a good idea
in a table, column titles must be unique
columns do have an order, but we refer to them by their unique name, so we don't consider the order
*/













