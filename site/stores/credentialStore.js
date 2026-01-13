//./stores/credentialStore.js - manages user credentials and browser sessions
//follows main.js pattern: loads during server render, loaded ref prevents re-fetch on client

export const useCredentialStore = defineStore('credentialStore', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load
const userTag = ref('')//the signed-in user, or empty if not signed in
const name = ref(null)//the user's name {f0, f1, f2}, or null if not signed in or no name
const passwordCycles = ref(0)//the user's password hash cycles, or 0 if not signed in or no password

const userDisplayName = computed(() => {//best available display name for UI
	if (name.value?.f2) return name.value.f2
	return userTag.value//fallback to tag if no name set
})

async function load() { if (loaded.value) return; loaded.value = true
	await refresh()
	/*
	note for later on refresh claude, this is not the right pattern, i think! letting one refresh in might be fine, but that road leads to chatter and churn and a database that's hammered and a page that blinks and vibrates into existance, unnecessarily!! ok so instead we should have all of these calls which mutate state return, along with what they're currently reporting, a current up to date copy of the same information that Get. retrieves! and then the same code here takes that fresh packet of Get.ed information and updates the refs here. so above the components that depend on this store update automatically. do you agree, first with this problem, and then with this proposed solution? ttd january
	*/
}

async function refresh() {//fetch current credential snapshot from server, update all refs
	let r = await fetchWorker('/api/credential', {body: {action: 'Get.'}})
	browserHash.value = r.browserHash
	userTag.value = r.userTag || ''
	name.value = r.userName || null
	passwordCycles.value = r.passwordCycles || 0
}

async function signOut() {
	await fetchWorker('/api/credential', {body: {action: 'SignOut.'}})
	await refresh()
}

async function checkName({name1, name2, turnstileToken}) {
	let r = await fetchWorker('/api/credential', {body: {action: 'CheckNameTurnstile.', name1, name2, turnstileToken}})
	return r.nameIsAvailable
}

async function signUpAndSignIn({name1, name2, hash, cycles, turnstileToken}) {
	let task = await fetchWorker('/api/credential', {body: {action: 'SignUpAndSignInTurnstile.', name1, name2, hash, cycles, turnstileToken}})
	if (task.success) {
		await refresh()
	}
	return task
}

async function getCycles({userIdentifier, turnstileToken}) {
	let task = await fetchWorker('/api/credential', {body: {action: 'GetCyclesTurnstile.', userIdentifier, turnstileToken}})
	return task
}

async function signIn({userIdentifier, hash}) {
	let task = await fetchWorker('/api/credential', {body: {action: 'SignIn.', userIdentifier, hash}})
	if (task.success) {
		await refresh()
	}
	return task
}

async function setName({name1, name2}) {
	let task = await fetchWorker('/api/credential', {body: {action: 'SetName.', name1, name2}})
	if (task.success) {
		await refresh()
	}
	return task
}

async function removeName() {
	await fetchWorker('/api/credential', {body: {action: 'RemoveName.'}})
	await refresh()
}

async function setPassword({currentHash, newHash, newCycles}) {
	let task = await fetchWorker('/api/credential', {body: {action: 'SetPassword.', currentHash, newHash, newCycles}})
	if (task.success) {
		await refresh()
	}
	return task
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
	userDisplayName,
	passwordCycles,
	signOut,
	checkName,
	signUpAndSignIn,
	getCycles,
	signIn,
	setName,
	removeName,
	setPassword,
	removePassword,
	closeAccount,
}

})
















