
import {
demonstrationSignGet, demonstrationSignUp, demonstrationSignIn, demonstrationSignOut,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['DemonstrationSignGet.', 'DemonstrationSignUp.', 'DemonstrationSignIn.', 'DemonstrationSignOut.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserTag}) {
	let r = {}

	switch (action) {
		case 'DemonstrationSignGet.': r = await demonstrationSignGet({origin: door.origin, browserTag                             }); break;
		case 'DemonstrationSignUp.':  r = await demonstrationSignUp( {origin: door.origin, browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignIn.':  r = await demonstrationSignIn( {origin: door.origin, browserTag, nameNormal: body.nameNormal}); break;
		case 'DemonstrationSignOut.': r = await demonstrationSignOut({origin: door.origin, browserTag                             }); break;
	}

	return r
}
