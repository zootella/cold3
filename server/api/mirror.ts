
import { log, see, Now, look } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { Sticker } from '@/library/sticker.js'
import { dog } from '@/library/cloud.js'

export default defineEventHandler((event) => {
	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024oct7a'
	o.serverTick = Now()
	o.headers = event.req.headers
	o.accessLength = 0//not supproted here anymore, use door
	o.tag = Tag()
	o.sayEnvironment = Sticker().all

	return o
})

