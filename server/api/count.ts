
import { log, see } from '../../library/library0.js'
import { unique } from '../../library/library1.js'

export default defineEventHandler((event) => {

	let o = {}
	o.message = 'hello from cold3 api count, version 2024may3f'
	o.countGlobal = 5
	o.countBrowser = 6

	return o;
});
