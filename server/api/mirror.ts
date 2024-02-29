
import { nanoid, customAlphabet } from "nanoid";
import { unique } from "../../library/library.js";//on the server, can't use ~ and must use .js

export default defineEventHandler((event) => {

	//custom
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const length = 21;
	let generator = customAlphabet(alphabet, length);
	let id = generator();

	let o = {};
	o.message = "hello from cold3 api mirror, version 2024feb29e";
	o.serverTick = Date.now();
	o.headers = event.req.headers;
	o.secretLength = (process.env.MY_FIRST_SECRET) ? process.env.MY_FIRST_SECRET.length : 0;
	o.unique = `unique ${unique()}`;

	return o;
});

