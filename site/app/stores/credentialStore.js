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

function apply(task) {//update all refs from task - called after any action that returns state
	if (!task.success) return//taken name, wrong password, paths like those that still aren't toss
	browserHash.value = task.browserHash || ''
	userTag.value = task.userTag || ''
	name.value = task.user || null
	passwordCycles.value = task.passwordCycles || 0
}

async function load() { if (loaded.value) return; loaded.value = true
	let task = await fetchWorker('/credential', 'Get.')
	apply(task)
}

async function signOut() {
	let task = await fetchWorker('/credential', 'SignOut.')
	apply(task)
}

async function checkName({name1, name2, turnstileToken}) {
	let task = await fetchWorker('/credential', 'CheckNameTurnstile.', {name1, name2, turnstileToken})
	return task.nameIsAvailable
}

async function signUpAndSignIn({name1, name2, hash, cycles, turnstileToken}) {
	let task = await fetchWorker('/credential', 'SignUpAndSignInTurnstile.', {name1, name2, hash, cycles, turnstileToken})
	apply(task)
	return task
}

async function getPasswordCycles({userIdentifier, turnstileToken}) {//returns cycles for sign-in attempt, not stored (pre-auth, for target user not current user)
	let task = await fetchWorker('/credential', 'GetPasswordCyclesTurnstile.', {userIdentifier, turnstileToken})
	return task
}

async function signIn({userIdentifier, hash}) {
	let task = await fetchWorker('/credential', 'SignIn.', {userIdentifier, hash})
	apply(task)
	return task
}

async function setName({name1, name2}) {
	let task = await fetchWorker('/credential', 'SetName.', {name1, name2})
	apply(task)
	return task
}

async function removeName() {
	let task = await fetchWorker('/credential', 'RemoveName.')
	apply(task)
}

async function setPassword({currentHash, newHash, newCycles}) {
	let task = await fetchWorker('/credential', 'SetPassword.', {currentHash, newHash, newCycles})
	apply(task)
	return task
}

async function removePassword() {
	let task = await fetchWorker('/credential', 'RemovePassword.')
	apply(task)
}

async function closeAccount() {
	let task = await fetchWorker('/credential', 'CloseAccount.')
	apply(task)
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
















