
import { log, see, Now } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { seal } from '@/library/ping.js'

export default defineEventHandler((event) => {

	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024sep8a'
	o.serverTick = Now()
	o.headers = event.req.headers
	//use defined() and hasText() below
	o.accessLength = (typeof process != 'undefined' && typeof process.env?.ACCESS_PASSWORD == 'string') ? process.env.ACCESS_PASSWORD.length : 0
	o.tag = Tag()
	o.sayEnvironment = seal().w3

	return o;
});

