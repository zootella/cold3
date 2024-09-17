
/*
$ node --version
v20.15.0

$ aws sts get-caller-identity
(will print out UserID, Account, and Arn)

$ node test
✅ 459 assertions in 42 tests all passed in 48ms on Wed 1h 52m 35.293s
*/

//access secrets
import dotenv from 'dotenv'//load process.env.ACCESS_ properties that we also deploy
dotenv.config()
import card from './env.js'//and additional private info just for local development

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-> ./test.js                  node
*/
import { runTests } from './library/test.js'
import { log, look } from './library/library0.js'
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























