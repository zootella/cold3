
import {
wrapper, sayFloppyDisk, runTests, runDatabaseTests,
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
			(await runTests()).message,//run isomorphic tests first
			(await runDatabaseTests()).message,//followed by database tests using pglite, which are slower; we run manually and locally
			''
		)

	} catch (e) { await awaitLogAlert('node test main uncaught', {e}) }
}
await main()
