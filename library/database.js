
/*
database.js
database schema, sql statements to create the tables
database utility functions
interface between the application and the database
keep it all here together for easy refactoring and auditing
*/

import { log, toss } from './library0.js'

import { createClient } from '@supabase/supabase-js'



let supabase;
if (process.env.ACCESS_SUPABASE_URL) supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY)


/*
SQL statements fed into Supabase to create the database tables.
Here in text notes; it would be better if they were tracked in git some other way!

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
console.log(isSafeBigInt(123456789012345)); // true
console.log(isSafeBigInt(-123456789012345)); // true
console.log(isSafeBigInt(9223372036854775807)); // true
console.log(isSafeBigInt(9223372036854775808)); // false
console.log(isSafeBigInt(-9223372036854775809)); // false
console.log(isSafeBigInt(123.456)); // false
console.log(isSafeBigInt('123456789012345')); // false, not a number

*/


/*
make sure postgresql has the default utf-8 character encoding with a sql statement like this:

SELECT pg_encoding_to_char(encoding) AS encoding
FROM pg_database
WHERE datname = current_database()

ran this in supabase's sql editor, and the result is "UTF8"
*/





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






/*
confirm that crazy unicode text like from instagram:
♦✎  𝓕𝔢βᖇǗ𝔞𝐑𝕪  🐸♔
can make it way all the way into the database and back up again
just code the user's note box that's stored in the database
*/

let nonsense = '♦✎  𝓕𝔢βᖇǗ𝔞𝐑𝕪  🐸♔'





























