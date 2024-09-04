
/*
$ node --version
v20.15.0

$ aws sts get-caller-identity
(will print out UserID, Account, and Arn)

$ node test
Wed 13h 20m 48.044s ~ ✅ Wed 13h 20m 48.044s ~ 381 assertions in 29 tests all passed in 42ms ✅
*/

//access secrets
import dotenv from 'dotenv'//load process.env.ACCESS_ properties that we also deploy
dotenv.config()
import card from './env.js'//and additional private info just for local development

//import library files
import { runTests, log, look } from './library/library0.js'
import './library/library1.js'
import './library/library2.js'
import './library/database.js'
import './library/cloud.js'
import { snippet } from './library/cloud2.js'

//snippet runner
async function runSnippet() {
	try {
		snippet(card)
	} catch (e) {
		log('caught uncaught exception from snippet!', look(e))
	}
}

//run tests followed by snippet
let results = await runTests()
console.log(results.message)//log out node test results without the tick prefix

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























