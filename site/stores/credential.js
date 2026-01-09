//./stores/credential.js - manages user credentials and browser sessions
//follows flex.js pattern: can load on server or client, uses loaded ref to prevent re-fetch

import {
Task,
fetchWorker,
} from 'icarus'

export const useCredentialStore = defineStore('credential', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load

async function load() { if (loaded.value) return; loaded.value = true
	await _fetch('Load.')
}

async function _fetch(action, body = {}) {
	let task = Task({name: 'credential store fetch'})
	try {
		task.response = await fetchWorker('/api/credential', {body: {action, ...body}})
	} catch (e) { task.error = e }
	task.finish()
	if (!task.success) throw task

	if (task.response.browserHash) browserHash.value = task.response.browserHash
	return task.response
}

return {
	loaded, load,
	browserHash,
}

})
















