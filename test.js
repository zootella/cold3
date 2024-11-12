
import {
log, addLogSink, look, runTests, newline,
awaitLogAlert,
//snippet,
} from 'icarus'
import card from './card.js'

import { promises as fs } from 'fs'
import dotenv from 'dotenv'

async function main() {
	try {
		dotenv.config()//load .env to be able to access secrets
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+newline) })//have log() also write to a file

		log((await runTests()).message)//run tests and log out the results
		//snippet(card)//run snippet, wherever it is, giving it card, private info from the git ignored file card.js
		//you're going to have to rethink that now that snippet is in persephone

	} catch (e) { await awaitLogAlert('node test main uncaught', {e}) }
}
await main()
