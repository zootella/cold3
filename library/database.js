
/*
database.js
database schema, sql statements to create the tables
database utility functions
interface between the application and the database
keep it all here together for easy refactoring and auditing
*/

import { toss } from './library0.js'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY)


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
	if (error) throw error
	return count > 0
}

// 2. Create the row with starting value zero
export async function createRow() {
	// SQL equivalent: INSERT INTO table_settings (key, value) VALUES ('count_global', '0')
	let { data, error } = await supabase
		.from('table_settings').insert([{ key: 'count_global', value: '0' }])
	if (error) throw error
}

// 3. Read the value
export async function readRow() {
	// SQL equivalent: SELECT value FROM table_settings WHERE key = 'count_global'
	let { data, error } = await supabase
		.from('table_settings').select('value').eq('key', 'count_global')
	if (error) throw error
	return data[0]?.value
}

// 4. Write a new value
export async function writeRow(newValue) {
	// SQL equivalent: UPDATE table_settings SET value = 'newValue' WHERE key = 'count_global' RETURNING *
	let { data, error } = await supabase
		.from('table_settings').update({ value: newValue }).eq('key', 'count_global').select()
	if (error) throw error
	if (!data.length) throw new Error('no error from update, but also no updated rows')
}






/*
confirm that crazy unicode text like from instagram:
♦✎  𝓕𝔢βᖇǗ𝔞𝐑𝕪  🐸♔
can make it way all the way into the database and back up again
just code the user's note box that's stored in the database
*/

let nonsense = '♦✎  𝓕𝔢βᖇǗ𝔞𝐑𝕪  🐸♔'





























