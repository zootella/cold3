
import {
wrapper, sayFloppyDisk, runTests,
log, addLogSink, look, newline,
awaitLogAlert,
} from 'icarus'

import {promises as fs} from 'fs'
import dotenv from 'dotenv'

async function main() {
	try {
		dotenv.config()//load .env to be able to access secrets
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+newline) })//have log() also write to a file

		log(
			sayFloppyDisk(wrapper).disk,//show 💾 with the current percent filled and shrinkwrap seal hash
			(await runTests()).message,//run tests and log out the results
			''
		)

	} catch (e) { await awaitLogAlert('node test main uncaught', {e}) }
}
await main()
