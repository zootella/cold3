
import {
demonstrationSignGet, demonstrationSignUp, demonstrationSignIn, demonstrationSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['DemonstrationSignGet.', 'DemonstrationSignUp.', 'DemonstrationSignIn.', 'DemonstrationSignOut.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action}) {
	let r = {}

	switch (action) {
		case 'DemonstrationSignGet.': r = await demonstrationSignGet({origin: door.origin, browserTag: body.browserTag});                        break;
		case 'DemonstrationSignUp.':  r = await demonstrationSignUp({origin: door.origin, browserTag:  body.browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignIn.':  r = await demonstrationSignIn({origin: door.origin, browserTag:  body.browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignOut.': r = await demonstrationSignOut({origin: door.origin, browserTag: body.browserTag});                        break;
	}

	return r
}
