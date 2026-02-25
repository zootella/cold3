//manages user credentials and browser sessions
//follows mainStore pattern: loads during server render, loaded ref prevents re-fetch on client
//all calls to /api/credential go through this store — components never import fetchWorker directly

export const useCredentialStore = defineStore('credentialStore', () => {

const loaded = ref(false)
const browserHash = ref('')//the hashed browser identifier, always present after load
const userTag = ref('')//the signed-in user, or empty if not signed in
const name = ref(null)//the user's name {f0, f1, f2}, or null if not signed in or no name
const passwordCycles = ref(0)//the signed-in user's password hash cycles, or 0 if not signed in or no password (set via apply after auth)
const totpEnrolled = ref(false)//true if the user has a verified TOTP enrollment
const totpIdentifier = ref('')//short identifier like "g3" to help user find the right authenticator entry
const enrollment = ref(null)//in-flight TOTP enrollment recovered from envelope cookie, or null

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
	totpEnrolled.value = task.totpEnrolled || false
	totpIdentifier.value = task.totpIdentifier || ''
	enrollment.value = task.enrollment || null
}

async function load() { if (loaded.value) return; loaded.value = true
	let totpCookie = useTotpCookie()
	let body = hasText(totpCookie.value) ? {envelope: totpCookie.value} : {}
	let task = await fetchWorker('/credential', 'Get.', body)
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

async function totpEnroll1() {
	let task = await fetchWorker('/credential', 'TotpEnroll1.')
	apply(task)
	return task
}

async function totpEnroll2({envelope, code}) {
	let task = await fetchWorker('/credential', 'TotpEnroll2.', {envelope, code})
	apply(task)
	return task
}

async function totpRemove() {
	let task = await fetchWorker('/credential', 'TotpRemove.')
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
	totpEnrolled,
	totpIdentifier,
	enrollment,
	signOut,
	checkName,
	signUpAndSignIn,
	getPasswordCycles,
	signIn,
	setName,
	removeName,
	setPassword,
	removePassword,
	totpEnroll1,
	totpEnroll2,
	totpRemove,
	closeAccount,
}

})
















