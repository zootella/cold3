
import {
Sticker, log, look, Now, Tag, getAccess, checkText,
doorWorker,
dog,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return doorWorker({workerEvent, useRuntimeConfig, setResponseStatus, doorProcessBelow})
})
async function doorProcessBelow(door) {
	let response = {}

	//CHECKPOINT 2
	dog('door worker')
	//blowup1()

	//prove you got the body by including in message
	let message = `hello ${door.body.name} age ${door.body.age} from door ${Sticker().all}`

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












