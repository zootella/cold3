






SQL statements fed into Supabase to create the database tables.
naming convention is smake_case with the type, like table, index, tag, tick, text, at the end



high level possible issues you've found
it only takes 100ms to call to the database
but look at checking a count
-call to see if the row is there, and get its number
...







//previous failed design:
/*
//you need this because you're storing booleans in the database as numbers like 0 false, 1 true
export function intToBoolean(i, minimum) {//if we've overloaded this database cell to hold enumerations like -1, pass minimum -1, otherwise defaults to 0
	checkInt(i, minimum)
	if      (i == 1) return true
	else if (i == 0) return false
	else toss('data', {i, minimum})
}
export function booleanToInt(b) {
	if (typeof b != 'boolean') toss('type', {b})
	return b ? 1 : 0
}
test(() => {
	let n = 0//first, just to confirm how javascript works
	let b = false
	ok(typeof n == 'number')
	ok(typeof b == 'boolean')

	ok(intToBoolean(0) === false && booleanToInt(false) === 0)
	ok(intToBoolean(1) === true  && booleanToInt(true)  === 1)
})
*/











/*
previous ones:


CREATE TABLE table_settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL
);

CREATE TABLE table_counts (
	browser_tag CHAR(21) PRIMARY KEY,
	count BIGINT DEFAULT 0 NOT NULL
);

*/


/*
notes about the complete subset of types you'll use:

CHAR(21) for tags, using this means it's a tag, even, which is great
CHAR(52) for hashes, using this means it's a hash
TEXT for all other text, email, username, posts, comments, base62 encoded encrypted text
BIGINT for boolean 0,1; enum -1,0,1,2; tick counts; any actual numbers

(and that might be all!)
and then your existing checkTag(), checkText(), checkInt() are good for script and the database
all you have to do is add under max to checkInt

chatting about types generally:

sounds like TEXT is postgres-specific, use for everything
except when you know the exact length, like a CHAR(21) tag

Type: INTEGER, BIGINT
INTEGER: A 4-byte integer that supports values from -
BIGINT: An 8-byte integer that supports values from -
so use BIGINT for everything
these have to be integers, and can be negative

there is a BOOLEAN type
but instead just use BIGINT 0 or 1 to enable you to do a 2 later, maybe

taht might be it
you're intentionally avoiding date, duration, and uuid types
ARRAY and JSON are common; maybe you'll use those, or maybe you'll instead accomplish array-like data with simple tables with multiple rows



*/







/*
do a little section in tests and library about number ranges
javascript has max integer, and then BigInt
postgres has BIGINT, huge but much smaller you think that max int
in here for fun also show how big tick counts are these days, capacity of a hard drive, and so on

[~]probably bake into checkInt that it's an integer that fits in 8 bytes (which is still huge)
or make a separate one you use when thinking about integers that will go into the postgres database

[~]add Size.bits = 8 to document math you do with that

maybe []add check in checkInt to make sure in safe range, so at or under javascript's maximum

--nevermind! postgres bigint is bigger than js max safe integer
postgres bigint is -(2^63) through (2^63)-1; -9223372036854775808 to +9223372036854775807 says web documentation
javascript number is -(2^53) through (2^53)-1; The safe integers consist of all integers from -(253 - 1) to 253 - 1, inclusive (±9,007,199,254,740,991) says web documentation

export function checkInt8(i, minimum) {
	checkInt(i, minimum)//make sure it's an integer

}



* Checks if a given number fits within the PostgreSQL BIGINT range.
*
* @param {number} num - The number to check.
* @returns {boolean} - True if the number fits within the PostgreSQL BIGINT range, otherwise false.
function isSafeBigInt(num) {
// BIGINT is an 8-byte signed integer
const BYTE_SIZE = 8;
const BITS_PER_BYTE = 8;
const TOTAL_BITS = BYTE_SIZE * BITS_PER_BYTE;

// Calculate the range for a signed 8-byte integer
const BIGINT_MIN = -(2 ** (TOTAL_BITS - 1));
const BIGINT_MAX = (2 ** (TOTAL_BITS - 1)) - 1;

// Check if the number is an integer
if (!Number.isInteger(num)) {
return false;
}

// Check if the number fits within the BIGINT range
return num >= BIGINT_MIN && num <= BIGINT_MAX;
}

// Example usage:
log(isSafeBigInt(123456789012345)); // true
log(isSafeBigInt(-123456789012345)); // true
log(isSafeBigInt(9223372036854775807)); // true
log(isSafeBigInt(9223372036854775808)); // false
log(isSafeBigInt(-9223372036854775809)); // false
log(isSafeBigInt(123.456)); // false
log(isSafeBigInt('123456789012345')); // false, not a number

*/


/*
make sure postgresql has the default utf-8 character encoding with a sql statement like this:

SELECT pg_encoding_to_char(encoding) AS encoding
FROM pg_database
WHERE datname = current_database()

ran this in supabase's sql editor, and the result is "UTF8"
*/



//global password account access design notes
/*

browsers are identified by their browser hash
that hash can be signed in or not

the table should always grow: rows are added, not edited
in addition to use specific information, rows generally always include a
row number, what you get from supabase or postgres by default
tag for unique identification
tick when the row was made

maybe this is all you need:

rownumber | tag      | tick   | browserhash | sign in or sign out
						CHAR(21)   BIGINT   CHAR(52)      BIGINT


making in the supabase dashboard
table_access, name
turned off row level security
two fields are already in there:
id, int8, maybe this is rownumber
created_at, timestamptz, now(), looks like an automatic tick stamp but not sure format or granularity
leaving those in and adding your own, even if there's some duplication

and talking to chat as you go
turning off rls is fine, and common when server code has exclusive access to the database
supabase's int8 is postgres BIGINT
checking primary key tells PostgreSQL that this column will uniquely identify each row in the table
PostgreSQL automatically creates an index on the primary key to ensure that lookups are fast.

Type: "timestamptz" (timestamp with time zone)

ok, chatting more here's the consensus:
-totally fine to keep RLS off, despite supabase warnings
-a table can only have one primary key, which has to be unique (advanced thing called composite key is the exception to this rule)
-postgres will build an index for that primary key, making lookups fast
-advanced thing called indexes like CREATE INDEX idx_user_id ON posts (user_id)
-also "While PostgreSQL’s query planner is quite sophisticated and can optimize queries using existing indexes, it won’t create new indexes on its own based on query usage."

so, use this as an excuse to at this early stage, make things simpler
rownumber is in there, and it's the primary key, but you ignore it
tag and tick get sent together from the worker, ignore timestampz and supabase's clock

rownumber | tag      | tick   | browserhash | sign in or sign out
						CHAR(21)   BIGINT   CHAR(52)      BIGINT


-row number: an automatically incrementing number that the database handles itself
-tag: CHAR(21), globally unique, set by my code
-tick: BIGINT, set by my code
-browser hash: CHAR(52), set by my code
-signed in: BIGINT, ill store 0 or 1 here to use that as a boolean


CREATE TABLE table_access (
	row_number BIGSERIAL PRIMARY KEY,
	tick BIGINT NOT NULL,
	tag CHAR(21) UNIQUE NOT NULL,
	browser_hash CHAR(52) NOT NULL,
	signed_in BIGINT NOT NULL
);

BIGSERIAL is 8 byte, and auto incrementing
it's standard to set this as the primary key, even if tag is also globally unique, picking that for now
there doesn't seem to be a way to get Date.now() easily in postgres, so we'll do that in the worker
*/

/*
next day
having some problems in supabase with the automatic row numbers
so, abandoning that
in excel and on a piece of paper, the rows have an order, but this isn't the case in postgres

picking tag as the primary key
it's guaranteed to be unique in the table and everywhere because it's a tag
you'll never sort or lookup by tag, and postgres will be ready to make that fast if you ever did, but that's ok

tick is when, according to the worker, the new row was inserted
you're thinking all your tables will start tag and tick like this

the common query is to filter by browser hash, and look at results sorted by tick
the index below makes this fast
postgres won't create this index automatically, but will use it automatically, looking at your query

CREATE TABLE table_access (
	tag CHAR(21) PRIMARY KEY NOT NULL, -- row identifier, globally unique, primary key
	tick BIGINT NOT NULL,              -- tick when record inserted
	browser_hash CHAR(52) NOT NULL,  -- Browser identifier used for filtering
	signed_in BIGINT NOT NULL  -- Boolean-like integer indicating signed-in status (e.g., 0 or 1)
);

CREATE INDEX idx_browser_hash_tick ON table_access (browser_hash, tick);

Ok to name the index index_browser_tick? Do these names need to be unique across my whole database, or are they specific to the table they're on?
OK, but then imagine I've got another table which also needs an index that filters by browser and sorts by tick. Shouldn't I include that table name in the index name if they must all be unique?

index_access_browser_tick




*/





/*
long chat about transactions that ended up with this

const sql = `
	BEGIN;
	INSERT INTO first_table (column) VALUES (quote_literal(${val1}));
	INSERT INTO second_table (column) VALUES (quote_literal(${val2}));
	COMMIT;
`
const { data, error } = await supabase.rpc('execute_sql', { sql })

imagine the database only makes sense when both, or neither of these rows are added
if one row is added, and the other one not there, the database isn't in a consistent state

also, imagine the first row inserts fine, but then
a valid error correctly prevents the second row from being inserted
there could be a uniqueness conflict on the second row, for instance

using the supabase api, each insert is a separate statement
js code will have to notice the error on the second insert
and then go back and try to remove the first

but this problem was solved in databases decades ago!
with somethign called the transaction
the begin and commit lines above group the two inserts into a single transaction
and, sure enough, if there's a problem anywhere in there, none of it sticks
and all of this is automatic

so you want to be able to use transactions
the problem is, the supabase api doesn't include them
there isn't a way to do two inserts in a single call to the supabase api, either
even with all the method chaining

so the plan is to
use the supabase api for reads
and individual writes
but when you need to insert multiple rows all at once
to drop down to raw sql and execute a block like above

but now you need to worry about the infamous sql injection attack
but maybe it's not too hard
you think essentially you just have to validate the inserts really well
and your own functions are doing this

but additionally, get protection from using knex, continued below
(that didn't work because they all assume api or node, rerouting)

also, batch raw inserts like this also will likely be faster,
as each trip to supabase is taking ~150ms
*/



/*
here's a crazy idea
your database design means that you're, at the start, going to have to get all the rows for a browser tag from maybe a half dozen different tables
then, with all those rows in the worker, you'll synthesize and decide what to do next
rather than most databases, which have requirements and a single users table, for instance

ok, so let's say that even the most trivial supabase call takes 100ms
so if you do 10 of them, that's a full second!
which is not acceptable, of course

but then you just realized, do multiple async calls in parallel in this case
yeah, how does that work in this fully finished time of async await
*/





//more recent notes and thinking and previous designs






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
2024nov11 ~ now you can clean this up





2024nov20 ~ new design note

some of these ideas may be known inventions, others discredited antipatterns
every row has a tick and a tag
code never deletes a row, rather, it adds a new one later which invalidates it
or marks a cell on the row as deleted--the column name for this is standard

instead of having a table for phone numbers and a table for email addresses,
and then doing long joins from users to each,
what if we had two columns in an existing table
the first tells the type of the contents of the second, like "Email." or "Phone."
and then the second has text with the value in the correct form for that type

so then if you just want all the email address in the database
instead of looking at one entire special email table
you filter the unified omnitable by "Email."

this is starting to be a little more like a document database
but could be simple enough, and will hugely reduce the number of tables that are in there
when you add a new data type, you don't have to create a new table for it
*/








/*
probably already written above
column names say their type, and if they don't end with a type, they're a BIGINT which might be used as a count, enum, or boolean


row_tag, globally unique tag chosen to identify this row, nothing else
row_tick, when this row was inserted
hide_enum, 0 by default, then nonzero to hide the row, perhaps because it's made not relevant by later rows, like the user deleted it, or edited it, or it's no longer necessary to come to the same conclusion
hidden rows should never never be sent to the client, for any reason--it's ok for the server to look at them and make decisions based upon them, though




>access_table
row_tag
row_tick
browser_tag
signed_in_enum (change from signed_in)

>counts_table
browser_tag
count_int (change from count) (no, now count is just fine again! woohoo!)

>settings_table
key_text
value_text



does katy already work this way?

also, you're really not sure of square encoding
maybe you don't need a multiple add
and maybe if you do, put all free form text, like something that isn't an email or name which is really restricted, in a separate table looked up by hash or tag

here's teh idea, the suffixes are:
_tick, bigint
_tag, text 21
_hash, text 52 or whatever
_text, variable text
(everything else), (no suffix), bigint
and everything else has to be an integer!
then you don't have to clutter names with _enum when actuall it's a count or a boolean, etc
this is a great idea

imagining how this might grow
_json, and postgres has a type for this, and if you use it a lot you sorta go into document database land, you've heard. not sure if you want to go there, but there might be a way to go there
_tags, meaning text like "Amazon.Email." holding two tags, and you're thinking tags are title case and always end with a period


current thinking is leave square encoding off to the side
for now, don't include it in katy at all

have you written katyCheck(r) yet taht takes a whole row
and inside it's like {
  row_tag:
row_hash
row_text
count
}
and it goes through them all, checking appropriately
if something doesn't have a suffix, then it hits it with whole integer negative or positive






2025jan19
diving back into katy




can you reflect types with column names
don't use square encoding
have high level, save, but not table nor application specific database functions

crazy idea to have local posgres and your own wrapper functions
less crazy idea to have test versions of tables, tests use them, you can switch the whole thing between them
card to export and import the database, the round trip



what if there was an object, static, that describes a table
names it, and what the columns are
so then you use that to setup a table
it switches between test and real
and it checks that you're specifying a row correctly

imagine there are data functions
they take, as a first argument, schema, which says what table, has the sql command that creates the table
these are const and you import them


should tags be UNIQUE?
chat says yes, because of the principal of defense in depth
also, if you label a column unique, then postgres builds a b tree index
which makes lookups by tag faster
you won't really be doing lookups by tag, though





















actually exported from desktop.js:











export async function accessTableInsert(browser_tag, signed_in) {
export async function accessTableQuery(browser_tag) {



export async function rowExists() {
export async function createRow() {
export async function readRow() {
export async function writeRow(newValue) {

export async function database_pingCount() {











/*
types are indicated by column names

*/
function checkCell(column, value){//column name and cell value
	let type = _type(column)
	if      (type == 'enum') { checkInt(value)    }//a boolean saved as the int 0 or 1 which could become an enum
	else if (type == 'tick') { checkInt(value)    }//a tick count of an actual time something happened
	else if (type == 'int')  { checkInt(value)    }//integer
	else if (type == 'tag')  { checkTag(value)    }//a tag, 21 letters and numbers
	else if (type == 'hash') { checkHash(value)   }//a sha256 hash value encoded to base32, 52 characters
//	else if (type == 'text') { checkSquare(value) }//text, can be blank, square encoded in the database 
	else { toss('data', {column, value}) }
}

function columnType(column) {
	
}
//where's the idea that if it doesn't have any of these, then it's an int, rather than requiring one
/*
name_tag
name_hash
name_text
everything else must be an integer

or you can also just

suffix is what is after the last underscore, or if none, the whole thing



*/



function settings_table(database) {
	return {database, table: 'settings_table', [
		'key_text',
		'value_text'
	]}
}

const createTables = `

-- settings for the application as a whole
CREATE TABLE settings_table (
	key_text    TEXT  PRIMARY KEY  NOT NULL, -- name of the setting
	value_text  TEXT               NOT NULL  -- value, text or numerals, blank if none so still not null
);

-- counts for each browser, works without being signed in
CREATE TABLE counts_table (
	browser_tag  CHAR(21)  PRIMARY KEY  NOT NULL, -- browser tag
	count        BIGINT                 NOT NULL  -- count for that browser
);

-- composite index so the common query that filters by browser tag and sorts by tick is fast
CREATE INDEX access_index_on_browser_tick ON access_table (browser_tag, row_tick);

CREATE TABLE table_access (
	row_number    BIGSERIAL  PRIMARY KEY  NOT NULL,
	tick          BIGINT                  NOT NULL,
	tag           CHAR(21)   UNIQUE       NOT NULL,
	browser_hash  CHAR(52)                NOT NULL,
	signed_in     BIGINT                  NOT NULL
);

CREATE TABLE table_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE table_counts (
  browser_tag CHAR(21) PRIMARY KEY,
  count BIGINT DEFAULT 0 NOT NULL
);



`


let createTablesParsed
export function table(database, name) {
	if (!createTablesParsed) createTablesParsed = parseCreateTables()
	return {database, table: createTablesParsed[name]}
}

function parseCreateTables() {
	/*
	todo, goes through the multiline string building a js object like this
	*/
	createTablesParsed = {
		settings_table: ['key_text', 'value_text']
	}
}


function access_table(database) {
	return {database, table: 'access_table', ['row_tag', 'row_tick', 'browser_tag', 'signed_in']}
}
function counts_table(database) {
	return {database, table: 'counts_table', ['browser_tag', 'count']}
}





function table_counts(database) {
	return {database, table: 'table_counts', ['browser_tag', 'count']}
}
function table_settings(database) {
	return {database, table: 'table_settings', ['key', 'value']}
}




/*
draft of high level notes:

yes make indices
no don't use foreign keys, they don't help with query speed



row_tag
row_tick
hide         -- initialize to zero to not hide, nonzero numbers indicate why its hidden

name_text
email_hash





column_enum   BIGNUM    boolean 0 or 1 which could grow in the future into an enumeration
column_tick   BIGNUM    tick count since the start of 1970
column_int    BIGNUM    number value counting something

column_tag    CHAR(21)  21 letters and numbers of a universally unique tag
column_hash   CHAR(52)  52 characters of a sha256 hash value encoded to base32
column_text   TEXT      text which can be blank or long, and is square encoded


does katy already work this way?

also, you're really not sure of square encoding
maybe you don't need a multiple add
and maybe if you do, put all free form text, like something that isn't an email or name which is really restricted, in a separate table looked up by hash or tag

here's teh idea, the suffixes are:
_tick, bigint
_tag, text 21
_hash, text 52 or whatever
_text, variable text
(everything else), (no suffix), bigint
and everything else has to be an integer!
then you don't have to clutter names with _enum when actuall it's a count or a boolean, etc
this is a great idea

imagining how this might grow
_json, and postgres has a type for this, and if you use it a lot you sorta go into document database land, you've heard. not sure if you want to go there, but there might be a way to go there
_tags, meaning text like "Amazon.Email." holding two tags, and you're thinking tags are title case and always end with a period
*/







export async function specified_rowExists() {
	let n = await countRows('settings_table', 'key_text', 'count')
	return n > 0
}
export async function specified_createRow() {
	await generalized_createRow('settings_table', [{key_text: 'count', value_text: intToText(0)}])
}
export async function specified_readRow() {
	let data = 
	return data[0]?.value_text
}
export async function specified_writeRow(newValue) {
}



export async function countRows(table, column, value) {
	let database = await realDatabase()
	let {data, error, count} = (await database.from(table).select(column, {count: 'exact'}).eq(column, value))
	if (error) toss('supabase', {error})
	return count
}
export async function addRow(table, row) {
	let database = await realDatabase()
	let {data, error} = (await database.from(table).insert(row))
	if (error) toss('supabase', {error})
}
export async function generalized_readRow(table, column, value) {
	let database = await realDatabase()
	let {data, error} = (await database.from(table).select('value_text').eq('key_text', 'count'))
	if (error) toss('supabase', {error})
	return data
}
export async function generalized_writeRow(tablenewValue) {
	let database = await realDatabase()
	let {data, error} = (await database.from(table).update({value_text: newValue}).eq('key_text', 'count').select())
	if (error) toss('supabase', {error})
	if (!data.length) toss('no updated rows')
}



/*
table:

some_table              table names must end _table

column: (the type is after the last _, or otherwise the whole thing)

_tag   CHAR(21)  21 letters and numbers of a universally unique tag
_hash  CHAR(52)  52 characters of a sha256 hash value encoded to base32

_text  TEXT  text which can be blank or long
_tags  TEXT  title case tags each of which ends with a period like "Amazon.Email."

_bool  BIGNUM  boolean 0 or 1 which could grow in the future into an enumeration
_enum  BIGNUM  
_int   BIGNUM  number value counting something
only   BIGNUM  any other name also treat as a number; text must be suffixed _text, above

future expansions:

_json
*/




/*
do you hit the database a third time at the end to confirm the change set?
can we reply on supabase not throwing or returning an error if the row didn't get in there
*/


/*
there needs to be server side logic so if the user is already signed in our out, they can't duplicate that
and also gray out buttons on the page

*/


