
import {
log, addLogSink, look, runTests, newline,
awaitLogAlert,
snippet,
} from 'icarus'
import card from './card.js'

import { promises as fs } from 'fs'
import dotenv from 'dotenv'

async function main() {
	try {
		dotenv.config()//load .env to be able to access secrets
		addLogSink((s) => { fs.appendFile('test.log', s.trimEnd()+newline) })//have log() also write to a file

		log((await runTests()).message)//run tests and log out the results
		snippet(card)//run snippet, wherever it is, giving it card, private info from the git ignored file card.js

	} catch (e) { await awaitLogAlert('node test main uncaught', {e}) }
}
await main()









/*
here's the easiest way to test email and sms, you now realize
place serverless, nuxt, icarus, all that, aside
place deploying each time and getting logs to logflare
place hooking up buttons to fetch to the worker to fetch to the lambda
all that, you don't need it

just go all the way back to node
$ node test.js

and then omg there's no live reload, there's no web browser
and you immediately get all the console output
and once things are working that way, they'll very likely work no problem beyond
*/

/*
maybe split out
$ node test
$ node snippet
$ node seal

and also get them into package.json so it's npm run test, npm run snippet, npm run seal
snippet probably also runs tests, maybe

i guess the other fancy wiring you could do is make it so deploy shrinkwraps and commits, or checks that you did
*/

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-> ./test.js                  node
*/

/*
$ node --version
v20.15.0

$ aws sts get-caller-identity
(will print out UserID, Account, and Arn)

$ node test
✅ 459 assertions in 42 tests all passed in 48ms on Wed 1h 52m 35.293s
*/










