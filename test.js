
import {
wrapper, sayFloppyDisk, runTests, runDatabaseTests,
log, addLogSink, look, newline,
} from 'icarus'
import {promises as fs} from 'fs'
import dotenv from 'dotenv'

async function main() {
	dotenv.config({quiet: true})//load .env to be able to access secrets
	addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+newline) })//have log() also write to a file

	log(
		sayFloppyDisk(wrapper).disk,//show 💾 with the current percent filled and shrinkwrap seal hash
		(await runTests()).message,//run tests and log out the results
		(await runDatabaseTests()).message,//followed by database tests using pglite, which are slower; we run manually and locally
		''
	)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
