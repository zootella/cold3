//manages user credentials and browser sessions
//follows mainStore pattern: loads during server render, loaded ref prevents re-fetch on client

export const useCredentialStore = defineStore('credentialStore', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load
const userTag = ref('')//the signed-in user, or empty if not signed in
const name = ref(null)//the user's name {f0, f1, f2}, or null if not signed in or no name
const passwordCycles = ref(0)//the signed-in user's password hash cycles, or 0 if not signed in or no password (set via apply after auth)

const userDisplayName = computed(() => {//best available display name for page
	if (name.value?.f2) return name.value.f2
	return userTag.value//fallback to tag if no name set
})

function apply(response) {//update all refs from response - called after any action that returns state
	if (!response.success) return//taken name, wrong password, paths like those that still aren't toss
	browserHash.value = response.browserHash || ''
	userTag.value = response.userTag || ''
	name.value = response.user || null
	passwordCycles.value = response.passwordCycles || 0
}

async function load() { if (loaded.value) return; loaded.value = true
	let response = await fetchWorker('/credential', 'Get.')
	apply(response)
}

async function signOut() {
	let response = await fetchWorker('/credential', 'SignOut.')
	apply(response)
}

async function checkName({name1, name2, turnstileToken}) {
	let response = await fetchWorker('/credential', 'CheckNameTurnstile.', {name1, name2, turnstileToken})
	return response.nameIsAvailable
}

async function signUpAndSignIn({name1, name2, hash, cycles, turnstileToken}) {
	let response = await fetchWorker('/credential', 'SignUpAndSignInTurnstile.', {name1, name2, hash, cycles, turnstileToken})
	apply(response)
	return response
}

async function getPasswordCycles({userIdentifier, turnstileToken}) {//returns cycles for sign-in attempt, not stored (pre-auth, for target user not current user)
	let response = await fetchWorker('/credential', 'GetPasswordCyclesTurnstile.', {userIdentifier, turnstileToken})
	return response
}

async function signIn({userIdentifier, hash}) {
	let response = await fetchWorker('/credential', 'SignIn.', {userIdentifier, hash})
	apply(response)
	return response
}

async function setName({name1, name2}) {
	let response = await fetchWorker('/credential', 'SetName.', {name1, name2})
	apply(response)
	return response
}

async function removeName() {
	let response = await fetchWorker('/credential', 'RemoveName.')
	apply(response)
}

async function setPassword({currentHash, newHash, newCycles}) {
	let response = await fetchWorker('/credential', 'SetPassword.', {currentHash, newHash, newCycles})
	apply(response)
	return response
}

async function removePassword() {
	let response = await fetchWorker('/credential', 'RemovePassword.')
	apply(response)
}

async function closeAccount() {
	let response = await fetchWorker('/credential', 'CloseAccount.')
	apply(response)
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
	getPasswordCycles,
	signIn,
	setName,
	removeName,
	setPassword,
	removePassword,
	closeAccount,
}

})
















