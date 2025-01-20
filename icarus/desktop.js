
import {
Now,
log, toss,
checkInt, checkText, checkTextOrBlank,
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



//cleanup: 0 new design





//cleanup: 1 actually exported




//insert a new row into table_access with the given row tag, browser hash, and signed in status
export async function accessTableInsert(browser_tag, signed_in) {
	checkTag(browser_tag)//put type checks here, you think, to be sure only good data gets inserted
	checkInt(signed_in)
	let { data, error } = (await (await client())
		.from('access_table')
		.insert([{ row_tick: Now(), row_tag: Tag(), browser_tag, signed_in }]))
	if (error) toss('supabase', {error})
}
//query table_access to get all the rows with a matching browser_tag
export async function accessTableQuery(browser_tag) {
	let { data, error } = (await (await client())
		.from('access_table')
		.select('*')
		.eq('browser_tag', browser_tag)
		.order('row_tick', { ascending: false }))//most recent row first
	if (error) toss('supabase', {error})
	return data
}




// Four functions for the row 'count_global' in table 'table_settings'
// 1. Determine if the row exists
export async function countGlobal_rowExists() {
	// SQL equivalent: SELECT COUNT(key) FROM table_settings WHERE key = 'count_global'
	let { data, error, count } = (await (await client())
		.from('table_settings').select('key', { count: 'exact' }).eq('key', 'count_global'))
	if (error) toss('supabase', {error})
	return count > 0
}
// 2. Create the row with starting value zero
export async function countGlobal_createRow() {
	// SQL equivalent: INSERT INTO table_settings (key, value) VALUES ('count_global', '0')
	let { data, error } = (await (await client())
		.from('table_settings').insert([{ key: 'count_global', value: '0' }]))
	if (error) toss('supabase', {error})
}
// 3. Read the value
export async function countGlobal_readRow() {
	// SQL equivalent: SELECT value FROM table_settings WHERE key = 'count_global'
	let { data, error } = (await (await client())
		.from('table_settings').select('value').eq('key', 'count_global'))
	if (error) toss('supabase', {error})
	return data[0]?.value
}
// 4. Write a new value
export async function countGlobal_writeRow(newValue) {
	// SQL equivalent: UPDATE table_settings SET value = 'newValue' WHERE key = 'count_global' RETURNING *
	let { data, error } = (await (await client())
		.from('table_settings').update({ value: newValue }).eq('key', 'count_global').select())
	if (error) toss('supabase', {error})
	if (!data.length) toss('no error from update, but also no updated rows')
}

//for the ping system, obviously refactor
export async function database_pingCount() {
	return readIntAsText(await readRow())//currently hardcoded into one cell of one table
}


















//cleanup: 2 actually used



//get a client connection to supabase
let _client
async function client() {//does this on first use, not on first import
	if (!_client) {//does this once on first use, not every time we need it
		let access = await getAccess()
		_client = createClient(access.get('ACCESS_SUPABASE_REAL1_URL'), access.get('ACCESS_SUPABASE_REAL1_KEY_SECRET'))
	}
	return _client
}













//cleanup: 3 the rest























































