
/*
$ node --version
v20.15.0

$ aws sts get-caller-identity
(will print out UserID, Account, and Arn)

$ node library/test
Wed 13h 20m 48.044s ~ ✅ Wed 13h 20m 48.044s ~ 381 assertions in 29 tests all passed in 42ms ✅
*/

import dotenv from 'dotenv'
dotenv.config({ path: './.env' })//explicitly load .env from the project root

import { runTests, log, inspect } from './library0.js'
import './library1.js'
import './library2.js'
import './database.js'
import './amazon.js'
import './fetchum.js'
import { snippet } from './test2.js'





async function runSnippet() {
	try {
		snippet()
	} catch (e) {
		log('caught exception from snippet', inspect(e))
	}
}

await runTests()
await runSnippet()




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























