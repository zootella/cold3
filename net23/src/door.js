
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorLambda,
dog, awaitLogAlert
} from '../../library/grand.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda(lambdaEvent, lambdaContext, doorProcessBelow)
}
async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 5
	dog('door lambda')
	//blowup1()

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from ${Sticker().all}`

	response.message = message
	response.when = Now()
	return response
}




function blowup1() {
	blowup2()
}
function blowup2() {
	blowup3()
}
function blowup3() {
	let o = {}
	o.notHere.blowupBeyond
}










