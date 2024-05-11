
import { log, see } from '../../library/library0.js'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY)

export default defineEventHandler(async (event) => {

	let o = {}
	o.message = 'hello from cold3 api count, version 2024may11b'
	o.countGlobal = 5
	o.countBrowser = 6
	o.count1 = 1
	o.count2 = 2

	log('hi from the count api, before')

  const { data, error } = await supabase.from('countries').select('*')
  if (error) {
  	log('error', see(error))
  } else {
  	log('no error, got data:', see(data), see(data[0]))
  }

	log('hi from the count api, after')


/*
		const body = await readBody(event)
		r.passwordCorrect = (body.password == process.env.ACCESS_SEND_PASSWORD)
		r.sendgridApiKeyLength = sendgridApiKey.length
		if (r.passwordCorrect && r.sendgridApiKeyLength) {
			r.sendNote = 'api key and password ok, will send'
			await sendEmail()
		} else {
			r.sendNote = "api key or password not ok, won't send"
		}
		r.handlerEnd = 'made it to the end'
		look(r)
*/



	/*
	import { createClient } from '@supabase/supabase-js'

	const supabaseUrl = 'your-supabase-url';
	const supabaseKey = 'your-supabase-key';
	const supabase = createClient(supabaseUrl, supabaseKey);

	async function getGlobalCount() {
		const { data, error } = await supabase
			.from('table_settings')
			.select('value')
			.eq('key', 'global_count')
			.single();  // Use `.single()` to return a single row directly

		if (error) {
			console.error('Error fetching global_count:', error);
			return null; // Or handle the error as needed
		}

		return data.value;
	}

	getGlobalCount().then(value => console.log('Global Count:', value));
	*/


	return o;
});






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
	// SQL equivalent: UPDATE table_settings SET value = 'newValue' WHERE key = 'hits'
	let { data, error } = await supabase
		.from('table_settings').update({ value: newValue }).eq('key', 'hits')
	if (error) throw error
	if (!data.length) throw new Error('no error from update, but also no updated rows')
}






