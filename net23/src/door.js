
const { loadIcarus } = require('../persephone/persephone.js');

exports.handler = async (lambdaEvent, lambdaContext) => {
	try {
		let { doorLambda } = await loadIcarus()
		return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: null }
}
async function doorProcessBelow(door) {
	let response = {}
	let { Sticker, dog } = await loadIcarus()

	//CHECKPOINT 5
	dog('door lambda')
	//blowup1()

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from ${Sticker().all}`
	//november refactor proof of door.body better than this

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










