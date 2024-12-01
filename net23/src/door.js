
import {
Sticker, doorLambda, dog,
} from 'icarus'





export const handler = async (lambdaEvent, lambdaContext) => {
	try {
		return doorLambda({lambdaMethod: 'Post.', lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return {statusCode: 500, headers: {'Content-Type': 'application/json'}, body: null}
}
async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 5
	dog('door lambda')
	//blowup1()

	let message = `${door.body.name}.${door.body.quantity}.${door.body.condition} from ${Sticker().all}`

	response.message = message
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
