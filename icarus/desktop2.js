
















/*
our tables do everthing with just a small handful of postgres types,
and our conventions for column titles identify what kind of data columns have:

example2_table            table names end _table, lowercase and numerals ok

row_tag         CHAR(21)  a globally unique tag to identify this row
row_tick        BIGNUM    set when we added the row
hide            BIGNUM    0 to start, nonzero to ignore this row in regular use
                          ^ most tables start with these three columns

password_hash   CHAR(52)  52 characters of a sha256 hash value encoded to base32
user_name_text  TEXT      text which can be blank or long

_tag, _hash, and _text are strings; everything else must be an integer
a column which can be a tag or blank is _text
as is a column which can be text or numerals, like settings_table
*/






//  _                         _ 
// | | __ _ _   _  ___ _ __  / |
// | |/ _` | | | |/ _ \ '__| | |
// | | (_| | |_| |  __/ |    | |
// |_|\__,_|\__, |\___|_|    |_|
//          |___/               








a takeaway here is
can you make this so 













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

querySetCell - change an existing cell to a new value
queryAddRows - add several at once
queryAddRow - add just one of them; these do all the checks first before leading to the same helper
queryCountRows
queryGetRows - get all of them, sorted
queryGetNRows - just the desired number, sorted by given title
queryGetSingleRow - use when you know there's zero or one
queryGetRecentRow - use when there could be many

how do you write fast little tests of these that really hit the database?
your manual testing has been slow and tedious
*/












/*
you realize you need this here, and maybe more widely
you're trying to read or write a cell
if the row isn't there, then you want to create the row with the default or starting value

currently, you do this with two round trips to the database
isntead, can you get the "not found" error from supabase, and then do the write

actually, you may not need this in the rest of the tables, and so you could skip the row exists check entirely
no wait you'll need it for browser tag, duh
*/











/*
this sitting goal: get all current database use factored through generalized functions
then tonight you can go on a notes and previous scraps deleteathon
*/

//these are the database functions in use; next, use the generalized functions above to refactor these away

//proposed

//bookmark january, next, use these in account.js, account2.js, and message.js, and then delete the remaining query_





































