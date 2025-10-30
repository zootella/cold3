
import {
demonstrationSignGet, demonstrationSignUp, demonstrationSignIn, demonstrationSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['DemonstrationSignGet.', 'DemonstrationSignUp.', 'DemonstrationSignIn.', 'DemonstrationSignOut.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {
	let r = {}

	switch (action) {
		case 'DemonstrationSignGet.': r = await demonstrationSignGet({origin: door.origin, browserHash                   }); break;
		case 'DemonstrationSignUp.':  r = await demonstrationSignUp( {origin: door.origin, browserHash, name0: body.name0}); break;
		case 'DemonstrationSignIn.':  r = await demonstrationSignIn( {origin: door.origin, browserHash, name0: body.name0}); break;
		case 'DemonstrationSignOut.': r = await demonstrationSignOut({origin: door.origin, browserHash                   }); break;
	}

	return r
}
