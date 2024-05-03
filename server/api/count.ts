
export default defineEventHandler((event) => {

	let o = {}
	o.message = 'hello from cold3 api count, version 2024may3i'
	o.countGlobal = 5
	o.countBrowser = 6

	return o;
});
