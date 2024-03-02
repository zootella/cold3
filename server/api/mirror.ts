
import { unique } from "../../library/library.js";//on the server, can't use ~ and must use .js

export default defineEventHandler((event) => {

	let o = {};
	o.message = "hello from cold3 api mirror, version 2024mar2a";
	o.serverTick = Date.now();
	o.headers = event.req.headers;
	o.secretLength = (process.env.MY_FIRST_SECRET) ? process.env.MY_FIRST_SECRET.length : 0;
	o.unique = `unique ${unique()}`;

	return o;
});

