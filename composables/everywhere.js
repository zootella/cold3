
//here's a hack to not have to import log into every .vue file
//manual imports still required in the api's .ts files, though

import {
	log as _log,
	see as _see
} from '~/library/library0'

export const log = _log
export const see = _see
