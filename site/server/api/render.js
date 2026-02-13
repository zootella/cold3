

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
credentialNameGet,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.'], workerEvent, doorHandleBelow})
})

async function doorHandleBelow({door, body, action, browserHash}) {
	if (action == 'Get.') {//public lookup of user by route part1; looking upwards are renderStore and profile page components
		let part1 = body.part1
		checkText(part1)

		let user = await credentialNameGet({part1})//lookup the user from their name
		if (!user) return {success: false, outcome: 'NotFound.'}

		return {success: true, user}//the user we found, with their user tag and name forms
	}
	return {success: true}
}
