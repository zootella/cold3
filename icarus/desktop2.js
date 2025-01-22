
import {
Now,
log, toss,
checkInt,
intToText, textToInt,
checkHash, checkSquare,
} from './level0.js'
import {
Tag, checkTag,
} from './level1.js'
import {
getAccess,
} from './level2.js'

import {createClient} from '@supabase/supabase-js'










//cleanup: 4 not yet sorted











/*
database.js
database schema, sql statements to create the tables
database utility functions
interface between the application and the database
keep it all here together for easy refactoring and auditing
*/
//no, actually, organize into tight sections and move into library2




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
	let { count, error } = (await (await client())
		.from(table)
		.select(column1, { count: 'exact' })//count exact matches based on column1
		.eq(column1, value1))//filter rows to those with value1
	if (error) toss('supabase', {error})
	return count
}

//add a new row to table, with values like { column1_name: cell1_value, column2_name... }
async function database_addRow(table, values) {
	katyTable(table); katyRow(values)
	let { data, error } = (await (await client())
		.from(table)
		.insert([values]))//make a new row with all the given values
	if (error) toss('supabase', { error })
	//no return
}

//in table, look at column1 to find one row with value1, then go right to column2, and write value2 there
async function database_updateCell(table, column1, value1, column2, value2) {
	katyTable(table); katyCell(column1, value1); katyCell(column2, value2)
	let { data, error } = (await (await client())
		.from(table)
		.update({ [column2]: value2 })//write value2 in column2
		.eq(column1, value1))//in the row where column1 equals value1
	if (error) toss('supabase', {error})
	//no return
}

//in table, look at column1 to find one row with value1, and get the whole row
async function database_getRow(table, column1, value1) {
	katyTable(table); katyCell(column1, value1)
	let { data, error } = (await (await client())
		.from(table)
		.select('*')//select all columns to get the whole row
		.eq(column1, value1)//find the row where column1 equals value1
		.single())//if no rows match returns data as null, if 2+ rows match returns error
	if (error) toss('supabase', {error})
	katyRow(data)
	return data//data is the whole row
}

//in table, look at column1 to get all the rows with value1, and get them biggest to smallest based on their values in columnSort
async function database_getRows(table, column1, value1, columnSort) {
	katyTable(table); katyCell(column1, value1); katyColumn(columnSort)
	let { data, error } = (await (await client())
		.from(table)
		.select('*')//select all columns to retrieve entire rows
		.eq(column1, value1)//filter to get rows where column1 equals value1
		.order(columnSort, { ascending: false }))//sort rows by column2 in descending order
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
async function settings_getText(name) {
	return readText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
async function settings_getNumber(name) {
	return readIntAsText((await database_getRow('settings_table', 'key_text', name)).value_text)
}
async function settings_setText(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveText(value))
}
async function settings_setNumber(name, value) {
	await database_updateCell('settings_table', 'key_text', name, 'value_text', saveIntAsText(value))
}

//global count
async function counts_getGlobalCount() {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		return row.count
	} else {
		await database_addRow('settings_table', {'key_text': browserTag, 'count_int': 0})
		return 0
	}
}
async function counts_setGlobalCount(count) {
	let row = await database_getRow('settings_table', 'key_text', browserTag)
	if (row) {
		await database_updateCell('settings_table', 'key_text', browserTag, 'count_int', count)
	} else {
		await database_addRow('settings_table', {'key_text': browserTag, 'count_int': count})
	}
}

//browser counts
async function counts_getBrowserCount(browserTag) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		return readInt(row.count)
	} else {
		await database_addRow('counts_table', {'browser_tag': browserTag, 'count_int': 0})
		return 0
	}
}
async function counts_setBrowserCount(browserTag, count) {
	let row = await database_getRow('counts_table', 'browser_tag', browserTag)
	if (row) {
		await database_updateCell('counts_table', 'browser_tag', browserTag, 'count_int', count)
	} else {
		await database_addRow('counts_table', {'browser_tag': browserTag, 'count_int': count})
	}
}

//browser sign in status records
async function access_addRecord(browserTag, signedIn) {
	await database_addRow('access_table', {
		row_tick: Now(),
		row_tag: Tag(),
		browser_tag: browserTag,
		signed_in_enum: saveBoolean(signedIn)
	})
}
async function access_getRecords(browserTag) {
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















//adding without reviewing all the work above here

function checkCell(column, value) {
	if      (column.endsWith('_tag'))  checkCell_text(value, tagLength)
	else if (column.endsWith('_hash')) checkCell_text(value, hashLength)
	else if (column.endsWith('_text')) checkCell_text(value)
	else if (column.endsWith('_tick')) checkCell_int(value)
	else                               checkCell_int(value)
}
function checkCell_text(value, requiredLength) {
	//make sure value is a string
	//and if we got a required length, that it's that length
	//what about checking characters for tags and hashes? should you do that? these are supposed to be really fast

	checkTag(value)
	checkHash(value)

}
function checkCell_int(value) {
	//here just check that it's an integer in javascript
	//the full range of those fit just fine into a PostgreSQL BIGINT

}





















/*
not sure you need the schema reflected; the current design is working well
also, if you name a column title that doesn't exist, or add an incomplete row, supabase will throw because of the not null everywhere
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



/*

what should the object structure be for rows?
does order matter? it does in postgres--is this all relying on order within an object?
*/




	//ttd january, so what you want is for table to identify the database to connect to, and to check that row has all the rows necessary--already, from their column titles, we can check teh types, which is great







/*
simple and powerful design goals:
1 high level functions that are operation, but not table, specific
2 schema object that identifies database and table, alongside commented create command for table and index
3 column titles that indicate type
and these last two are how the function validates data going into a table
*/






/*
what if instead you kept these very simple and very local
table names and column titles can only be a-z_ can't be blank, can't have spaces or uppercase
numbers can only be integers within javascript range, can totally be negative
(doing that here means you don't have to mess with the goodwin dragon at the lowest level)
tags and hashes have their own character and length requirements



[]switch from column to title, which is easier to type and shorter
what's the use of cell versus value, maybe cell is what you should use

bookmark january
ok, you renamed column -> title, and you're not sure you like it
next you'd rename value -> cell, but you think that one you will like better, actually

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





//[]ttd january, rename count to hits, and implement browser hits, also





//ttd january, probably have one which gets not one row, not all rows sorted, rather the greatest tick row, that one row
//and then the idea here is, you keep on adding generalized functions, even if each is quite specific to a new type of query you want to do
/*
at this level, call these the query functions
rename to be like:

queryUpdateCell
queryAddRows - add several at once
queryAddRow - add just one of them
queryCountRows
queryGetRows - get all of them
queryGetNRows - just the desired number, sorted by given title
queryGetSingleRow - use when you know there's zero or one
queryGetRecentRow - use when there could be many

how do you write fast little tests of these that really hit the database?
your manual testing has been slow and tedious
*/





