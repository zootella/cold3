//./stores/credential.js - manages user credentials and browser sessions
//follows main.js pattern: loads during server render, loaded ref prevents re-fetch on client

export const useCredentialStore = defineStore('credential', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load
const userTag = ref('')//the signed-in user, or empty if not signed in

async function load() { if (loaded.value) return; loaded.value = true
	let r = await fetchWorker('/api/credential', {body: {action: 'Get.'}})
	browserHash.value = r.browserHash
	if (r.userTag) userTag.value = r.userTag
}

async function signOut() {
	await fetchWorker('/api/credential', {body: {action: 'SignOut.'}})
	userTag.value = ''
}

async function checkName({slug, display}) {
	return await fetchWorker('/api/credential', {body: {action: 'CheckName.', slug, display}})
}

async function signUpAndSignIn({slug, display, hash, cycles}) {
	let r = await fetchWorker('/api/credential', {body: {action: 'SignUpAndSignIn.', slug, display, hash, cycles}})
	if (r.outcome == 'SignedUp.') {
		userTag.value = r.userTag
	}
	return r
}

return {
	loaded, load,
	browserHash,
	userTag,
	signOut,
	checkName,
	signUpAndSignIn,
}

})
















