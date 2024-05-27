
import { log, see, now } from '../../library/library0.js'
import { tag } from '../../library/library1.js'//on the server, can't use ~ and must use .js

export default defineEventHandler((event) => {

	let o = {};
	o.message = "hello from cold3 api mirror, version 2024may27a";
	o.serverTick = now();
	o.headers = event.req.headers;
	o.accessLength = (process.env.ACCESS_TOKEN_2) ? process.env.ACCESS_TOKEN_2.length : 0;
	o.tag = tag();

	return o;
});

