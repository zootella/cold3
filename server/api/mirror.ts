export default defineEventHandler((event) => {

	let o = {};
	o.headers = event.req.headers;
	o.secretLength = (process.env.MY_FIRST_SECRET) ? process.env.MY_FIRST_SECRET.length : 0;
	o.serverTick = Date.now();
	o.message = "hello from cold3 api mirror, version 2024feb28a";

	return o;
});
