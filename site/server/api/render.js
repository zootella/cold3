
import {
credentialNameGet,
credentialBrowserGet,
} from 'icarus'

/*
render.js - API endpoint for page rendering data

This endpoint provides data needed to render pages, particularly user profile pages.
It's separate from credential.js which handles authentication/authorization actions.

Actions:
- LookupName. - look up user by route segment for profile page rendering
*/

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['LookupName.'], workerEvent, doorHandleBelow})
})

async function doorHandleBelow({door, body, action, browserHash}) {
	let task = Task({name: 'render api'})

	if (action == 'LookupName.') {
		//public lookup of user by route segment - used by useUserRoute composable for user profile pages
		//returns name forms (f0, f1, f2) and userTag; also indicates if requesting browser owns this profile
		let nameRecord = await credentialNameGet({raw1: body.raw1})
		if (!nameRecord) {
			task.finish({success: false, outcome: 'NotFound.'})
			return task
		}
		task.lookup = {
			userTag: nameRecord.userTag,
			f0: nameRecord.v.f0,//normalized: "tokyo-girl"
			f1: nameRecord.v.f1,//canonical route: "Tokyo-Girl"
			f2: nameRecord.v.f2,//display name: "東京ガール"
		}
		//check if requesting browser is signed in as this user (for personalized profile rendering)
		let viewer = await credentialBrowserGet({browserHash})
		task.lookup.isOwner = !!(viewer && viewer.userTag === nameRecord.userTag)
	}

	task.finish({success: true})
	return task
}
