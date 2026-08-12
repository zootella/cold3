
import {
wrapper, sayFloppy, runTests, runDatabaseTests,
log, addLogSink, look,
} from 'icarus'
import {promises as fs} from 'fs'
async function main() {
	process.loadEnvFile()//load .env to be able to access secrets
	if (false) {//optionally have log() also write to a file
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+'\n') })
	}

	let r1 = await runTests()//isomorphic unit tests in JavaScript like test(async () => { ok(true) })
	let r2 = await runDatabaseTests()//pglite tests that simulate database table state, still all ephemeral in memory
	let r3 = await runImportTests()//confirm the lambda's module graph loads with current icarus
	log(sayFloppy(wrapper).disk, r1.message, r2.message, r3.message, '')

	if (!(r1.success && r2.success && r3.success)) process.exit(1)//exit code 1 tells the shell a step failed, stopping any && chain
}
async function runImportTests() {//the lambda ships icarus as a real runtime import, unbundled, so a missing or renamed export there only blows up at module load--catch that here rather than at cold start on amazon; the worker side doesn't need this, because nuxt build bundles icarus into the worker and fails on a missing export before anything deploys
	let paths = ['./net23/src/message.js', './net23/src/upload.js']//the lambda handler entry points, which pull in persephone and icarus beneath them
	try {
		for (let path of paths) await import(path)
		return {success: true, message: `✅ ${paths.length} lambda handlers and everything they import load clean`}
	} catch (e) {
		return {success: false, message: '🚧 lambda import failure: '+look(e)}
	}
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
