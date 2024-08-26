
/*
database.js
database schema, sql statements to create the tables
database utility functions
interface between the application and the database
keep it all here together for easy refactoring and auditing
*/

import { log, toss, Now, checkInt, hasText, checkText, defined, test, ok, squareEncode, squareDecode, intToText, textToInt, checkHash, checkSquare } from './library0.js'
import { Tag, checkTag } from './library1.js'

import { createClient } from '@supabase/supabase-js'

let supabase;
if (defined(typeof process) && hasText(process?.env?.ACCESS_SUPABASE_URL)) supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY)

//  _         _             _                  _   _                _                  
// | | ____ _| |_ _   _    | |__   __ _ _ __  | |_| |__   ___    __| | ___   ___  _ __ 
// | |/ / _` | __| | | |   | '_ \ / _` | '__| | __| '_ \ / _ \  / _` |/ _ \ / _ \| '__|
// |   < (_| | |_| |_| |_  | |_) | (_| | |    | |_| | | |  __/ | (_| | (_) | (_) | |   
// |_|\_\__,_|\__|\__, ( ) |_.__/ \__,_|_|     \__|_| |_|\___|  \__,_|\___/ \___/|_|   
//                |___/|/                                                              
/*
our defense against writing malformed data into the database
check and convert data between the application and the database

here are the postgres types we're using are:
BIGNUM    boolean 0 1, enumeration like -1 0 1 2, integer, tick
CHAR(21)  tag
CHAR(52)  hash
TEXT      variable length text, square brace encoding
*/

/*
function saveInt(i, m) { checkInt(i, m); return i }//minimum m like -1 or 0+ default
function readInt(i, m) { checkInt(i, m); return i }

function saveBooleanAsInt(b) { return b ? 1    : 0     }//we save booleans in the database as bignum 1 and 0
function readBooleanAsInt(i) { return i ? true : false }

function saveIntAsText(i) { return intToText(i) }//the settings tables saves everything as text, so convert with these
function readIntAsText(s) { return textToInt(s) }//checkInt is built into these conversion functions

function saveTag(s) { checkTag(s); return s }
function readTag(s) { checkTag(s); return s }

function saveTick(t) { checkInt(t); return t }
function readTick(t) { checkInt(t); return t }

function saveHash(h) { checkHash(h); return h }
function readHash(h) { checkHash(h); return h }

function saveText(s) { if (s === '') return s; checkText(s); return squareEncode(s) }//blank text allowed
function readText(s) { if (s === '') return s; checkText(s); return squareDecode(s) }
*/



/*
//ok, katy finds another position at the door
//these are all pass-through without transformation, throw on sings of trouble
//you could use them read and save
//they're wired to validate every cell of a whole bunch of returned rows, which may be slow and unecessary
//but start with this and optimize later
*/
function katyRows(rows) {//here's an array of rows, are you really going to check every cell? you need to see how many ms this adds on larger queries. you technically don't have to do this, imagining bad data is never added to the database
	rows.forEach(katyRow)
	return rows
}
function katyRow(row) {//object of column names: cell contents
	for (let [column, value] of Object.entries(row)) katyCell(column, value)//won't pick up properties that are non-enumerable or from the prototype chain
	return row
}
function katyCell(column, value){//column name and cell value
	let type = _type(column)
	if      (type == 'enum') { checkInt(value)            }//a boolean saved as the int 0 or 1 which could become an enum
	else if (type == 'tick') { checkInt(value)            }//a tick count of an actual time something happened
	else if (type == 'int')  { checkInt(value)            }//integer
	else if (type == 'tag')  { checkTag(value)            }//a tag, 21 letters and numbers
	else if (type == 'hash') { checkHash(value)           }//a sha256 hash value encoded to base32, 52 characters
	else if (type == 'text') { checkSquare(value) }//text, can be blank, square encoded in the database 
	else { toss('data', {column, value}) }
	return value
}
function katyColumn(columnName){//just a column name
	_type(columnName)//throws if there isn't 
	return columnName
}
function katyTable(tableName) {//just a table name, this one is silly
	if (_type(tableName) != 'table') toss('data', {tableName})
}
function _type(s) {//from a column name like 'name_type', clip out 'type'
	checkText(s)
	let i = s.lastIndexOf('_')
	if ((i < 1) || (s.length < i + 2)) toss('data', {s})//shortest possible valid column name is 'a_b'
	return s.substring(s.lastIndexOf('_') + 1)
}


//layer 0.5
/*

hmmm...
rested brain thinking on getting katy into level 0
what if, as a design requrement, every column title has to end with the type

name_enum - boolean which could grow in the future into an enumeration
name_tick - number which is a tick count, could grow to include negative
name_int
name_tag
name_hash
name_text - text which must be encoded in square braces

then in layer0, everything going in and out is checked for type by these keys
*/


/*
maybe you don't square encode here--that's in a layer above
but you do make sure that all text is square encoded
that means that text can be blank or have a legal for square encoding
*/





//  _                          ___  
// | | __ _ _   _  ___ _ __   / _ \ 
// | |/ _` | | | |/ _ \ '__| | | | |
// | | (_| | |_| |  __/ |    | |_| |
// |_|\__,_|\__, |\___|_|     \___/ 
//          |___/                   
/*
functions that call the supabase api
they work on whatever table you tell them to
you have to get the column names and data types right yourself
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
functions that are specific to not tables, but kinds of data and how the application uses them
*/

//settings
export async function settingsGetText(name) {
	return readText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
export async function settingsGetNumber(name) {
	return readNumberAsText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
export async function settingsSetText(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveText(value))
}
export async function settingsSetNumber(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveNumberAsText(value))
}

//global count
export async function countsGetGlobalCount() {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		return readInt(row.count)
	} else {
		await database_addRow('settings_table', {'key_text': saveTag(browserTag), 'count': saveInt(0)})
		return 0
	}
}
export async function countsSetGlobalCount(count) {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		await database_updateCell('settings_table', 'key_text', saveTag(browserTag), 'count', saveInt(count))
	} else {
		await database_addRow('settings_table', {'key_text': saveTag(browserTag), 'count': saveInt(count)})
	}
}

//browser counts
export async function countsGetBrowserCount(browserTag) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		return readInt(row.count)
	} else {
		await database_addRow('counts_table', {'browser_tag': saveTag(browserTag), 'count': saveInt(0)})
		return 0
	}
}
export async function countsSetBrowserCount(browserTag, count) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		await database_updateCell('counts_table', 'browser_tag', saveTag(browserTag), 'count', saveInt(count))
	} else {
		await database_addRow('counts_table', {'browser_tag': saveTag(browserTag), 'count': saveInt(count)})
	}
}


/*
hmmm
rested brain ideas to get katy into level 0
what if, as a design requirement, every column name has to end with a type, like

name_text
name_tag
name_tick
name_



*/



/*
get the count will always be first

set the count may not have a row yet
*/


/*hide

export async function countsGetCount(browserTag) {
	let rowCount = 

}
export async function countsSetCount(browserTag) {

}

async function countsCheckRow(browserTag) {
	if (!await database_countRows('counts_table', 'browser_tag', browserTag)) {//now row yet

	}
}





	return readInt((await database_getRow('counts_table', 'browser_tag', browserTag)).count)
}
export async function countsTable_setCount(browserTag, count) {
	await database_updateCell('counts_table', 'browser_tag', browserTag, 'count', saveInt(count))
}



export async function accessTable_insert(browserTag, signedIn) {
	await database_addRow('access_table', {
		row_tick: Now(),
		row_tag: Tag(),
		browser_tag: saveTag(browserTag),
		signed_in: saveBooleanAsInt(signedIn)
	})
}
export async function accessTable_query(browserTag) {
	return await database_getRows('access_table', 'browser_tag', browserTag, 'row_tick')
}

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

/*hide

async function browserCount_hasRecord(browserTag)
async function browserCount_startRecord(browserTag)
async function browserCount_getRecord(browserTag)
async function browserCount_setRecord(browserTag, count)

async function globalCount_hasRecord() {
	return await database_countRows('settings_table', 'key_text', 'count') > 0
}
async function globalCount_startRecord() (
	database_addRow('settings_table', {
		'key_text': 'count',
		'value_text': '0'
	})
}
async function globalCount_get() {
	return await database_getRow('settings_table', 'key_text', 'count').value_text
}
async function globalCount_set(count) {
	//here's where you have to check and convert count!!!!!!!!!
	await database_updateCell('settings_table', 'key_text', 'count', 'value_text', count)
}
*/

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



















