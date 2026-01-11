//./stores/credential.js - manages user credentials and browser sessions
//follows main.js pattern: loads during server render, loaded ref prevents re-fetch on client

export const useCredentialStore = defineStore('credential', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load
const userTag = ref('')//the signed-in user, or empty if not signed in
const name = ref(null)//the user's name {f0, f1, f2}, or null if not signed in or no name
const passwordCycles = ref(0)//the user's password hash cycles, or 0 if not signed in or no password

async function load() { if (loaded.value) return; loaded.value = true
	await refresh()
}

async function refresh() {//fetch current credential snapshot from server, update all refs
	let r = await fetchWorker('/api/credential', {body: {action: 'Get.'}})
	browserHash.value = r.browserHash
	userTag.value = r.userTag || ''
	name.value = r.name || null
	passwordCycles.value = r.passwordCycles || 0
}

async function signOut() {
	await fetchWorker('/api/credential', {body: {action: 'SignOut.'}})
	await refresh()
}

async function checkName({slug, display}) {
	return await fetchWorker('/api/credential', {body: {action: 'CheckName.', slug, display}})
}

async function signUpAndSignIn({slug, display, hash, cycles}) {
	let r = await fetchWorker('/api/credential', {body: {action: 'SignUpAndSignIn.', slug, display, hash, cycles}})
	if (r.outcome == 'SignedUp.') {
		await refresh()
	}
	return r
}

async function removeName() {
	await fetchWorker('/api/credential', {body: {action: 'RemoveName.'}})
	await refresh()
}

async function removePassword() {
	await fetchWorker('/api/credential', {body: {action: 'RemovePassword.'}})
	await refresh()
}

async function closeAccount() {
	await fetchWorker('/api/credential', {body: {action: 'CloseAccount.'}})
	await refresh()
}

return {
	loaded, load,
	browserHash,
	userTag,
	name,
	passwordCycles,
	signOut,
	checkName,
	signUpAndSignIn,
	removeName,
	removePassword,
	closeAccount,
}

})
















