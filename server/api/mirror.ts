
import { log, see, Now } from '../../library/library0.js'
import { Tag } from '../../library/library1.js'

export default defineEventHandler((event) => {

	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024jul6a'
	o.serverTick = Now()
	o.headers = event.req.headers
	o.accessLength = (process.env.ACCESS_TOKEN_2) ? process.env.ACCESS_TOKEN_2.length : 0
	o.tag = Tag()

	return o;
});

