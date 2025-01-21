
import {
Now, log, toss, test, ok,
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



/*
simple and powerful design goals:
1 high level functions that are operation, but not table, specific
2 schema object that identifies database and table, alongside commented create command for table and index
3 column titles that indicate type
and these last two are how the function validates data going into a table
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
	for (let [column, value] of Object.entries(row)) checkCell(column, value)//won't pick up properties that are non-enumerable or from the prototype chain
}
test(() => {
	let row = [
		{'name_text': 'bob'},
		{'count': 7},
		{'some_tag': 'yz5OjTi1aeD4YnEM47gUD'},
		{'some_hash': 'DVSYLVWF4UKPIR5W5RYJWNIUFVS3B2BFEE6W7X5ENDT2SCEOIZ4A'},
		{'preference': 0},
	]
})
/*
^this is the row format you want, you think
but what row format does the supabase api give you?
*/
function checkCell(column, value){//column name and value in a cell beneath that column
	let type = _type(column)
	if      (type == 'tag')  { checkTag(value)         }//a tag, 21 letters and numbers
	else if (type == 'hash') { checkHash(value)        }//a sha256 hash value encoded to base32, 52 characters
	else if (type == 'text') { checkTextOrBlank(value) }//text, can be blank
	else                     { checkInt(value)         }
}
test(() => {
	checkCell('browser_tag', '5WWs2JIIZQZ6UFJj2bHH2')
	checkCell('password_hash', 'DVSYLVWF4UKPIR5W5RYJWNIUFVS3B2BFEE6W7X5ENDT2SCEOIZ4A')
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







//in table, look at column1, and count how many rows have value1
export async function database_countRows(table, column1, value1) {
	checkCell(column1, value1)
	let database = await realDatabase()
	let {count, error} = (await database
		.from(table)
		.select(column1, {count: 'exact'})//count exact matches based on column1
		.eq(column1, value1))//filter rows to those with value1
	if (error) toss('supabase', {error})
	return count
}

//add a new row to table, with values like {column1_name: cell1_value, column2_name...}
export async function database_addRow(table, values) {
	checkRow(values)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.insert([values]))//make a new row with all the given values
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column1 to find one row with value1, then go right to column2, and write value2 there
export async function database_updateCell(table, column1, value1, column2, value2) {
	checkCell(column1, value1); checkCell(column2, value2)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.update({[column2]: value2})//write value2 in column2
		.eq(column1, value1))//in the row where column1 equals value1
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column1 to find one row with value1, and get the whole row
export async function database_getRow(table, column1, value1) {
	checkCell(column1, value1)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to get the whole row
		.eq(column1, value1)//find the row where column1 equals value1
		.single())//if no rows match returns data as null, if 2+ rows match returns error
	if (error) toss('supabase', {error})
	return data//data is the whole row
}
/*
	let row = await database_getRow({table: 'settings_table', column: 'key_text', cell: 'count'})
*/

//in table, look at column1 to get all the rows with value1, and get them biggest to smallest based on their values in columnSort
export async function database_getRows(table, column1, value1, columnSort) {
	checkCell(column1, value1); katyColumn(columnSort)
	let database = await realDatabase()
	let {data, error} = (await database
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(column1, value1)//filter to get rows where column1 equals value1
		.order(columnSort, {ascending: false}))//sort rows by column2 in descending order
	if (error) toss('supabase', {error})
	return data//data is an array of rows
}














