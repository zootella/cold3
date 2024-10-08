
import {
log, see, Now, look, Tag, Sticker,
saveUseRuntimeConfigFunction, Access
} from '@/library/grand.js'

export default defineEventHandler((event) => {
	saveUseRuntimeConfigFunction(useRuntimeConfig)//nuxt already imported here; save it where Access can reach it
	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024oct8b'
	o.serverTick = Now()
	o.headers = event.req.headers
	o.accessLength = Access('ACCESS_PASSWORD_SECRET').length//not supproted here anymore, use door
	o.tag = Tag()
	o.sayEnvironment = Sticker().all

	return o
})

