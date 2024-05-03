
import { log, see } from '../../library/library0.js'
import { unique } from '../../library/library1.js'//on the server, can't use ~ and must use .js

export default defineEventHandler((event) => {

	let o = {};
	o.message = "hello from cold3 api mirror, version 2024may3c";
	o.serverTick = Date.now();
	o.headers = event.req.headers;
	o.accessLength = (process.env.ACCESS_TOKEN_2) ? process.env.ACCESS_TOKEN_2.length : 0;
	o.unique = `unique ${unique()}`;

	return o;
});

