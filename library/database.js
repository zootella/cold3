
/*
database.js
database schema, sql statements to create the tables
database utility functions
interface between the application and the database
keep it all here together for easy refactoring and auditing
*/

import { log, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare } from './library0.js'
import { Tag, checkTag } from './library1.js'
import { Access } from './library2.js'

//todo get both the import and createClient in a conditional load pattern
import { createClient } from '@supabase/supabase-js'
let supabase
try {
	if (defined(typeof process)) supabase = createClient(Access('ACCESS_SUPABASE_URL'), Access('ACCESS_SUPABASE_KEY_SECRET'))
} catch (ignore){}//todo need some environment detection here, if server

//  _         _             _                  _   _                _                  
// | | ____ _| |_ _   _    | |__   __ _ _ __  | |_| |__   ___    __| | ___   ___  _ __ 
// | |/ / _` | __| | | |   | '_ \ / _` | '__| | __| '_ \ / _ \  / _` |/ _ \ / _ \| '__|
// |   < (_| | |_| |_| |_  | |_) | (_| | |    | |_| | | |  __/ | (_| | (_) | (_) | |   
// |_|\_\__,_|\__|\__, ( ) |_.__/ \__,_|_|     \__|_| |_|\___|  \__,_|\___/ \___/|_|   
//                |___/|/                                                              

/*
our tables do everthing with just a small handful of postgres types,
and our conventions for table and column names identify what kind of data columns have:

some_table              table names must end _table

column_enum   BIGNUM    boolean 0 or 1 which could grow in the future into an enumeration
column_tick   BIGNUM    tick count since the start of 1970
column_int    BIGNUM    number value counting something

column_tag    CHAR(21)  21 letters and numbers of a universally unique tag
column_hash   CHAR(52)  52 characters of a sha256 hash value encoded to base32
column_text   TEXT      text which can be blank or long, and is square encoded

you must use squareEncode() and squareDecode() in a layer above this one!

katy's functions, below, are our defense against saving or reading malformed data
they use the column name convention to check the data is correct for the stated type
*/

function katyTable(tableName) {//just a table name, this one is silly
	if (_type(tableName) != 'table') toss('data', {tableName})
}
function katyColumn(columnName){//just a column name
	_type(columnName)//throws if there isn't 
}
function katyRows(rows) {//here's an array of rows, are you really going to check every cell? you need to see how many ms this adds on larger queries. you technically don't have to do this, imagining bad data is never added to the database
	rows.forEach(katyRow)
}
function katyRow(row) {//object of column names: cell contents
	for (let [column, value] of Object.entries(row)) katyCell(column, value)//won't pick up properties that are non-enumerable or from the prototype chain
}
function katyCell(column, value){//column name and cell value
	let type = _type(column)
	if      (type == 'enum') { checkInt(value)    }//a boolean saved as the int 0 or 1 which could become an enum
	else if (type == 'tick') { checkInt(value)    }//a tick count of an actual time something happened
	else if (type == 'int')  { checkInt(value)    }//integer
	else if (type == 'tag')  { checkTag(value)    }//a tag, 21 letters and numbers
	else if (type == 'hash') { checkHash(value)   }//a sha256 hash value encoded to base32, 52 characters
	else if (type == 'text') { checkSquare(value) }//text, can be blank, square encoded in the database 
	else { toss('data', {column, value}) }
}

function _type(s) {//from a column name like 'name_type', clip out 'type'
	checkSquare(s)//ensure table and column names don't contain puncutation potentially useful to inject sql
	let i = s.lastIndexOf('_')
	if ((i < 1) || (s.length < i + 2)) toss('data', {s})//shortest possible valid column name is 'a_b'
	return s.substring(s.lastIndexOf('_') + 1)
}

/*
katy checks, she doesn't transform
so here are the functions you need in layer1 to do necessary data transformations

for instance, database schema and conventions keep a boolean like true false
as the values 1 or 0 in a BIGINT column with a name like something_enum

while no names or text can contain characters that won't be in square encoded text,
all text in TEXT columns (names ending _text) is saved safely square encoded
use saveText() and readText() in layer1 below to do this encoding there exactly once each way

and in some instances, like the settings table,
a TEXT column has some values that the application knows to interpret as ints
use saveIntAsText() and readIntAsText() for these cells
*/
function saveBoolean(b) { return b ? 1    : 0     }
function readBoolean(i) { return i ? true : false }

function saveText(s) { return squareEncode(s) }
function readText(s) { return squareDecode(s) }

function saveIntAsText(i) { return intToText(i) }
function readIntAsText(s) { return textToInt(s) }

//  _                          ___  
// | | __ _ _   _  ___ _ __   / _ \ 
// | |/ _` | | | |/ _ \ '__| | | | |
// | | (_| | |_| |  __/ |    | |_| |
// |_|\__,_|\__, |\___|_|     \___/ 
//          |___/                   

/*
all the functions that call the supbase api have to be here, and are not exported, either!
they work on whatever table you tell them to
and katy checks the column names and data types going in both directions
*/

//in table, look at column1, and count how many rows have value1
async function database_countRows(table, column1, value1) {
	katyTable(table); katyCell(column1, value1)
	let { count, error } = await supabase
		.from(table)
		.select(column1, { count: 'exact' })//count exact matches based on column1
		.eq(column1, value1)//filter rows to those with value1
	if (error) toss('supabase', {error})
	return count
}

//add a new row to table, with values like { column1_name: cell1_value, column2_name... }
async function database_addRow(table, values) {
	katyTable(table); katyRow(values)
	let { data, error } = await supabase
		.from(table)
		.insert([values])//make a new row with all the given values
	if (error) toss('supabase', { error })
	//no return
}

//in table, look at column1 to find one row with value1, then go right to column2, and write value2 there
async function database_updateCell(table, column1, value1, column2, value2) {
	katyTable(table); katyCell(column1, value1); katyCell(column2, value2)
	let { data, error } = await supabase
		.from(table)
		.update({ [column2]: value2 })//write value2 in column2
		.eq(column1, value1)//in the row where column1 equals value1
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column1 to find one row with value1, and get the whole row
async function database_getRow(table, column1, value1) {
	katyTable(table); katyCell(column1, value1)
	let { data, error } = await supabase
		.from(table)
		.select('*')//select all columns to get the whole row
		.eq(column1, value1)//find the row where column1 equals value1
		.single()//if no rows match returns data as null, if 2+ rows match returns error
	if (error) toss('supabase', {error})
	katyRow(data)
	return data//data is the whole row
}

//in table, look at column1 to get all the rows with value1, and get them biggest to smallest based on their values in columnSort
async function database_getRows(table, column1, value1, columnSort) {
	katyTable(table); katyCell(column1, value1); katyColumn(columnSort)
	let { data, error } = await supabase
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(column1, value1)//filter to get rows where column1 equals value1
		.order(columnSort, { ascending: false })//sort rows by column2 in descending order
	if (error) toss('supabase', {error})
	katyRows(data)//if this is slow, it's not necessary
	return data//data is an array of rows
}

/*
notes:
what's more at this level?
joins, maybe, where you're returning rows based on how they match up with other tables
*/

//  _                         _ 
// | | __ _ _   _  ___ _ __  / |
// | |/ _` | | | |/ _ \ '__| | |
// | | (_| | |_| |  __/ |    | |
// |_|\__,_|\__, |\___|_|    |_|
//          |___/               

/*
in this higher layer, functions are specific to the application's use of the database
only starting here can functions be exported

this is also where you use saveText() and readText() to square encode and decode
this way, you only have to do that here
and you know that in each direction, you're only doing it one time

katy will make sure no characters that won't appear in square encoded text get anywhere near the database
but she only checks, she doesn't transform, so here is where you do square encoding
similarly, this is also where you convert a truthy javascript variable into the number 1
for a BIGINT column named something_enum
and where you keep numeric settings as text in the settings table

as well as other application-specific data transformations in the future, they'll be here
keeping katy simple and strong above
*/

//settings
export async function settings_getText(name) {
	return readText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
export async function settings_getNumber(name) {
	return readIntAsText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
export async function settings_setText(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveText(value))
}
export async function settings_setNumber(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveIntAsText(value))
}

//global count
export async function counts_getGlobalCount() {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		return row.count
	} else {
		await database_addRow('settings_table', {'key_text': browserTag, 'count_int': 0})
		return 0
	}
}
export async function counts_setGlobalCount(count) {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		await database_updateCell('settings_table', 'key_text', browserTag, 'count_int', count)
	} else {
		await database_addRow('settings_table', {'key_text': browserTag, 'count_int': count})
	}
}

//browser counts
export async function counts_getBrowserCount(browserTag) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		return readInt(row.count)
	} else {
		await database_addRow('counts_table', {'browser_tag': browserTag, 'count_int': 0})
		return 0
	}
}
export async function counts_setBrowserCount(browserTag, count) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		await database_updateCell('counts_table', 'browser_tag', browserTag, 'count_int', count)
	} else {
		await database_addRow('counts_table', {'browser_tag': browserTag, 'count_int': count})
	}
}

//browser sign in status records
export async function access_addRecord(browserTag, signedIn) {
	await database_addRow('access_table', {
		row_tick: Now(),
		row_tag: Tag(),
		browser_tag: browserTag,
		signed_in_enum: saveBoolean(signedIn)
	})
}
export async function access_getRecords(browserTag) {
	return await database_getRows('access_table', 'browser_tag', browserTag, 'row_tick')
}

/*
TODO change the schema in Supabase! :(0)

can you rename signed_in to signed_in_enum?
you need to make this change in supabase

also in counts_table, you need to rename count to count_int

*/







/*
account needs:
make a row for a sign in record
get all the rows for a browser of all its sign in records, sorted newest first

browser count needs:
is there already a row for this browser?
what is this browser's count?
update this browser's count to the new value

global count needs:
is there already a row for this global count setting?
make that row with starting count 0
update the global count setting row to this new value


*/
//at this level, make it not about the table, but rather about the application use case



/*
you may be overdoing the naming, settings_table should have the columns name and value, how about
*/







/*
there's a generalized layer
which has all the calls to supabase
you tell it which table to use, and have to get the cells and values right yourself

then there's a layer above that
functions specific to a table and the operations on that table
this is where you can do last checks and transformations of the data


*/









/*
-- settings for the whole application
CREATE TABLE settings_table (
	key_text    TEXT  PRIMARY KEY  NOT NULL, -- name of the setting
	value_text  TEXT                         -- value, text or numerals
);
*/

function settingsTable_readRow(key) {}
function settingsTable_createRow(key, value) {}
function settingsTable_writeRow(key, value) {}

/*
-- counts for each browser, works without being signed in
CREATE TABLE counts_table (
	browser_tag  CHAR(21)  PRIMARY KEY  NOT NULL, -- browser tag
	count        BIGINT                 NOT NULL
);
*/
function countsTable_readRow(browserTag) {}
function countsTable_createRow(browserTag, count) {}
function countsTable_writeRow(browserTag, count) {}




//                _     _         
//           ___ | | __| |        
//  _____   / _ \| |/ _` |  _____ 
// |_____| | (_) | | (_| | |_____|
//          \___/|_|\__,_|        
//                                


/*
-- records of browsers signing in with password and signing out
CREATE TABLE access_table (
	row_tag      CHAR(21)  PRIMARY KEY  NOT NULL, -- row tag
	row_tick     BIGINT                 NOT NULL, -- when inserted
	browser_tag  CHAR(21)               NOT NULL, -- browser tag
	signed_in    BIGINT                 NOT NULL  -- 0 signed out or 1 signed in
);
-- composite index to make a filtering by browser tag and sorting by tick fast
CREATE INDEX access_index_on_browser_tick ON access_table (browser_tag, row_tick);
*/

//insert a new row into table_access with the given row tag, browser hash, and signed in status
export async function accessTableInsert(browser_tag, signed_in) {
	checkTag(browser_tag)//put type checks here, you think, to be sure only good data gets inserted
	checkInt(signed_in)
	let { data, error } = await supabase
		.from('access_table')
		.insert([{ row_tick: Now(), row_tag: Tag(), browser_tag, signed_in }])
	if (error) toss('supabase', {error})
}
//query table_access to get all the rows with a matching browser_tag
export async function accessTableQuery(browser_tag) {
	let { data, error } = await supabase
		.from('access_table')
		.select('*')
		.eq('browser_tag', browser_tag)
		.order('row_tick', { ascending: false })//most recent row first
	if (error) toss('supabase', {error})
	return data
}




// Four functions for the row 'count_global' in table 'table_settings'
// 1. Determine if the row exists
export async function rowExists() {
	// SQL equivalent: SELECT COUNT(key) FROM table_settings WHERE key = 'count_global'
	let { data, error, count } = await supabase
		.from('table_settings').select('key', { count: 'exact' }).eq('key', 'count_global')
	if (error) toss('supabase', {error})
	return count > 0
}
// 2. Create the row with starting value zero
export async function createRow() {
	// SQL equivalent: INSERT INTO table_settings (key, value) VALUES ('count_global', '0')
	let { data, error } = await supabase
		.from('table_settings').insert([{ key: 'count_global', value: '0' }])
	if (error) toss('supabase', {error})
}
// 3. Read the value
export async function readRow() {
	// SQL equivalent: SELECT value FROM table_settings WHERE key = 'count_global'
	let { data, error } = await supabase
		.from('table_settings').select('value').eq('key', 'count_global')
	if (error) toss('supabase', {error})
	return data[0]?.value
}
// 4. Write a new value
export async function writeRow(newValue) {
	// SQL equivalent: UPDATE table_settings SET value = 'newValue' WHERE key = 'count_global' RETURNING *
	let { data, error } = await supabase
		.from('table_settings').update({ value: newValue }).eq('key', 'count_global').select()
	if (error) toss('supabase', {error})
	if (!data.length) toss('no error from update, but also no updated rows')
}



//for the ping system, obviously refactor
export async function database_pingCount() {
	log('here we are')
	return readIntAsText(await readRow())//currently hardcoded into one cell of one table
}















