
export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['Get.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, headers, browserHash}) {
	//while this is written as a regular endpoint, this happens once for a new tab's GET as part of the server render

	//user info now comes from credentialStore via /api/credential, not from here
	//future: response.feed = await userToFeed({userTag}) for signed-in users, ttd january
	let t = Now()
	let response = {success: true}
	response.duration = Now() - t//ceremony left over from removing the task object, ttd february
	return response
}
