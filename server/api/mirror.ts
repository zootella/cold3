
import { nanoid, customAlphabet } from "nanoid";

export default defineEventHandler((event) => {

	//regular
	let id1 = nanoid();

	//custom
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const length = 21;
	let generator = customAlphabet(alphabet, length);
	let id = generator();

	let o = {};
	o.message = "hello from cold3 api mirror, version 2024feb29a";
	o.serverTick = Date.now();
	o.headers = event.req.headers;
	o.secretLength = (process.env.MY_FIRST_SECRET) ? process.env.MY_FIRST_SECRET.length : 0;
	o.message2 = `id ${id}`;

	return o;
});

