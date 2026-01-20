

/*
notes in render.txt about:
pages/[part1]/index.vue    ->  ProfilePage.vue
pages/[part1]/[part2].vue  ->  PostPage.vue

and how those four use:
stores/renderStore.js
server/api/render.js
composables/useRouteCorrection.js

find these files together by searching "render stack"
*/

import {
credentialNameGet, credentialBrowserGet,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['LookupName.'], workerEvent, doorHandleBelow})
})

async function doorHandleBelow({door, body, action, browserHash}) {
	let task = Task({name: 'render api'})

	if (action == 'LookupName.') {
		let raw1 = body.raw1
		checkText(raw1)
		//public lookup of user by route segment - used by renderStore for user profile pages
		//returns name forms (f0, f1, f2) and userTag; also indicates if requesting browser owns this profile
		let nameRecord = await credentialNameGet({raw1})
		if (!nameRecord) {
			task.finish({success: false, outcome: 'NotFound.'})
			return task
		}
		task.lookup = {
			userTag: nameRecord.userTag,
			name: nameRecord.v,//{ok, f0, f1, f2} from validateName; ok:true marks this as a validated name object
		}
		//check if requesting browser is signed in as this user (for personalized profile rendering)
		let viewer = await credentialBrowserGet({browserHash})
		task.lookup.isOwner = !!(viewer && viewer.userTag === nameRecord.userTag)
	}

	task.finish({success: true})
	return task
}
