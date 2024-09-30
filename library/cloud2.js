
/*
expeditionary notes
map complete plans out here before you change code
*/


/*
~~~~~~~~ switch to yarn
*/









/*
~~~~~~~~ use axios
*/









/*
~~~~~~~~ no await logs
*/



/*
this needs to work from:
lambda, deployed and local
worker, deployed and local
node, local

the issue of a second lambda request comes into the same running lambda processing a first request
and then module-scope variables are shared between the two requests
maybe, this is ok? both requests are gloming promises onto the module scoped promise
which eventually will resolve
and then both, seprately, respond to their callers at the same time, with separate results
so, you slowed down two lambdas instead of one




*/


//you've got these functions in door.js
export async function doorWorkerOpen(workerEvent){}
export function doorLambdaOpen(lambdaEvent, lambdaContext){}
/*
above them, have a module scoped variable
no, that doesn't work because
-lambdas can share execution environments
-workers dont need them

ok, pass down the door object
where do you need to call these?
dog - anywhere
logAudit - anywhere
logAlert - 
logFragile - 
*/


async function sketch1() {

	//so here we are, deep in a call stack
	//this is fine:
	await dog('note')
	//it's going to return something, but we don't care

	//same thing, except no waiting this time:
	let p = dog('note')
	door.waitUntil(p)

	/*
	so then you do always have to use promises, either await or door.waitUntil
	if cloudflare, just calls event.waitUntil
	if lambda or node, does await promise all before the concluding return

	*/





}

/*
ok, so this seems to be working, and now you've got a few different options here

what you want is to be able to just call
dog()
logAlert()
with no await, nothing fancy
and no passing in door, even!

what if you did module scoped variables


async function awaitDog(){}          function dog()
async function awaitLogAudit(){}     function logAudit()




*/




let _door = []
export function setDoor(door) {
	_door.push(door)
	if (_door.length > 1) await awaitLogFragile('detected environment reuse!', {_door})
}
export function getDoor() {
	if (_door.length > 1) return null//lambda used the same environment for two requests, so we don't know which one is correct to return!
	return _door[0]
}
//then, if you can pass the door reference, do that, if not, use getDoor()
//but also, can you await if there's no door?
//well, this didn't stay simple very long







export function logAudit(headline, watch) {
	let door = getDoor()


	let p = actualLogAudit(headline, watch)
	if (door) {
		if (door.parallelPromise) {
			door.parallelPromise = Promise.all([door.parallelPromise, p])//glom p on
		} else {
			door.parallelPromise = p//set the first p
		}
	} else {
		/*
		here, you're stuck
		there is no door, meaning you're in a lambda that has reused the environment
		and, the caller didn't use await, which means you can't stay here
		*/

	}

}
export function awaitLogAudit(headline, watch) {
	return await actualLogAudit(headline, watch)
}
async function actualLogAudit(headline, watch) {
	let c = prepareLog('info', 'type:audit', 'AUDIT', headline, watch)
	if (cloudLogSimulationMode) { cloudLogSimulation(c) } else {
		console.log(c.body[0].message)
		sendLog_useIcarus(c.body[0].message)
		await sendLog_useFile(c.body[0].message)
		return await sendLog_useDatadog(c)//keep an audit trail of every use of third party apis, running both cloud *and* local
	}
}



/*
yes, time to back out
because this is really complex
and datadog isn't going to slow things down--supabase is, and you do have to await those
if you've already spent time sending an email, another 150ms to make sure you audit it in datadog doesn't matter



*/




