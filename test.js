
import {
wrapper, sayFloppy, runTests,
log, addLogSink, look,
} from 'icarus'
import {runDatabaseTests} from './icarus/grid.js'//the grid tests and their runner live outside the barrel; this local test runner is the only code anywhere that imports them
import {promises as fs} from 'fs'
async function main() {
	process.loadEnvFile()//load .env to be able to access secrets
	if (false) {//optionally have log() also write to a file
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+'\n') })
	}

	let r1 = await runTests()//isomorphic unit tests in JavaScript like test(async () => { ok(true) })
	let r2 = await runDatabaseTests()//pglite tests that simulate database table state, still all ephemeral in memory
	let r3 = await runImportTests()//confirm the lambda's module graph loads with current icarus
	log(sayFloppy(wrapper).disk, r1.message, r2.message, '')
	if (!r3.success) log(r3.message)//the import check speaks only when it fails

	if (!(r1.success && r2.success && r3.success)) process.exit(1)//exit code 1 tells the shell a step failed, stopping any && chain
}

/*
The lambda import check

The lambda ships icarus unbundled, as a real runtime import that Node resolves at cold start, and its handlers keep their own lists of names imported from icarus. ES modules resolve named imports when the graph links, before any code runs, so a handler that imports a name icarus no longer exports fails at that instant with "does not provide an export named", and on Amazon that instant is the first request after a deploy: the whole lambda dead. The worker side can't fail this way, because nuxt build bundles icarus into the worker and stops on a missing export before anything ships.

This check imports the two handler entry points here, in the root test run, which links persephone and icarus beneath them exactly as the lambda would. It catches a stale import name, a module path that no longer resolves, a file that no longer parses, and top-level code that throws. It does not catch a function body using a name it never imported; that is a ReferenceError when the function runs, and only a test that runs it, or the smoke test through the browser, sees it.

The browser smoke test at /up3 reaches the local lambda too, and serverless-offline relinks the graph on every request, so it would catch the same thing. What it needs is a local lambda running and a pass through the browser after every change to icarus. On August 12, 2026 the smoke test passed, then the cookie options moved out of icarus, then the deploy went out without another pass, and persephone's import of the old name killed the lambda at cold start. This check runs from the command line with nothing else up, every time the tests run, and says nothing when it passes.
*/
async function runImportTests() {
	let paths = ['./net23/src/message.js', './net23/src/upload.js']//the lambda handler entry points, which pull in persephone and icarus beneath them
	try {
		for (let path of paths) await import(path)
		return {success: true}
	} catch (e) {
		return {success: false, message: '🚧 lambda import failure: '+look(e)}
	}
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
