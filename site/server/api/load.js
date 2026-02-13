
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserHash}) {
	let task = Task({name: 'load api'})//while this is written as a regular endpoint, this happens once for a new tab's GET as part of the server render

	//user info now comes from credentialStore via /api/credential, not from here
	//future: task.feed = await userToFeed({userTag}) for signed-in users, ttd january
	task.finish({success: true})
	return task
}
