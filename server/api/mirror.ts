
import {
log, see, Now, look, Tag, Sticker,
saveUseRuntimeConfigFunction, getAccess
} from '@/library/grand.js'

export default defineEventHandler(async (event) => {
	saveUseRuntimeConfigFunction(useRuntimeConfig)//nuxt already imported here; save it where access can reach it
	let access = await getAccess()

	let o = {}
	o.message = 'hello from cold3 api mirror, version 2024oct8b'
	o.serverTick = Now()
	o.headers = event.req.headers
	o.accessLength = access.get('ACCESS_PASSWORD_SECRET').length//not supproted here anymore, use door
	o.tag = Tag()
	o.sayEnvironment = Sticker().all
	return o
})

