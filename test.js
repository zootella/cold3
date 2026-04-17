
import {
wrapper, sayFloppy, runTests, runDatabaseTests,
log, addLogSink, look, nlreview,
} from 'icarus'
import {promises as fs} from 'fs'
async function main() {
	process.loadEnvFile()//load .env to be able to access secrets
	if (false) {//optionally have log() also write to a file
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+nlreview) })
	}

	let r1 = await runTests()//isomorphic unit tests in JavaScript like test(async () => { ok(true) })
	let r2 = await runDatabaseTests()//pglite tests that simulate database table state, still all ephemeral in memory
	log(sayFloppy(wrapper).disk, r1.message, r2.message, '')

	if (!(r1.success && r2.success)) process.exit(1)//exit code 1 tells the shell a step failed, stopping any && chain
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
