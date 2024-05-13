
import { log, see } from '../../library/library0.js'
/*
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY)
*/

export default defineEventHandler(async (event) => {
	let o = {}
	try {


		let body = await readBody(event)
		log('body is:', see(body))

		o.message = 'hi from api count, version 2024may13b'
		o.mirroredBody = body


/*

		//create the row if it doesn't exist
		if (!(await rowExists())) {
			await createRow()
			log("row didn't exist, created it")
		}


		//increment
		let i = 0
		if (body.count1 > 0) {
			log('need to increment the count')

			i = +(await readRow())//read, convert string to int afterards
			i += body.count1//increment with requested value
//			writeRow(i+'')//write, convert int to string beforehand

			log('deep inside', i+'')
		}

		//read
//		i = +(await readRow())//read or read again to check, convert string to int afterards


		o.countGlobal = 0
		o.countBrowser = 0
		o.count1 = i
		o.count2 = 0
		o.message = 'hello from cold3 api count, version 2024may11b'

*/

	} catch (e) {
		log('count caught: ', e)
	}
	return o;
});




/*

// Four functions for the row 'hits' in table 'table_settings'

// 1. Determine if the row exists
async function rowExists() {
	// SQL equivalent: SELECT COUNT(key) FROM table_settings WHERE key = 'hits'
	let { data, error, count } = await supabase
		.from('table_settings').select('key', { count: 'exact' }).eq('key', 'hits')
	if (error) throw error
	return count > 0
}

// 2. Create the row with starting value zero
async function createRow() {
	// SQL equivalent: INSERT INTO table_settings (key, value) VALUES ('hits', '0')
	let { data, error } = await supabase
		.from('table_settings').insert([{ key: 'hits', value: '0' }])
	if (error) throw error
}

// 3. Read the value
async function readRow() {
	// SQL equivalent: SELECT value FROM table_settings WHERE key = 'hits'
	let { data, error } = await supabase
		.from('table_settings').select('value').eq('key', 'hits')
	if (error) throw error
	return data[0]?.value
}

// 4. Write a new value
async function writeRow(newValue) {
	log('hi in write row')
	// SQL equivalent: UPDATE table_settings SET value = 'newValue' WHERE key = 'hits'
	let { data, error } = await supabase
		.from('table_settings').update({ value: newValue }).eq('key', 'hits')
	if (error) throw error
	if (!data.length) throw new Error('no error from update, but also no updated rows')
}


*/



