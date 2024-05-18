
//here's a hack to not have to import log into every .vue file
//manual imports still required in the api's .ts files, though

import {
	log as _log,
	inspect as _inspect,
	now as _now,
	sayTick as _sayTick
} from '~/library/library0'

import {
	tag as _tag
} from '~/library/library1'

export const log = _log
export const inspect = _inspect
export const now = _now
export const sayTick = _sayTick

export const tag = _tag
