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
const wallet = ref('')//checksummed Ethereum address the user has proven they control, or empty
const oauths = ref([])//array of linked third-party accounts: [{provider, identifier, handle, name, email}, ...]
const emails = ref([])//the user's email addresses: [{f0, f1, f2, event}, ...] event 4 proven, 3 code sent, 2 only mentioned
const phones = ref([])//the user's phone numbers, same shape
const otps = ref([])//live otp code challenges at this browser: [{tag, start, address}, ...]; the answers stay sealed in the envelope cookie

const otpCookie = useOtpCookie()//captured here at store setup so apply can reach it after awaits; the store is the only code that touches this cookie

const userDisplayName = computed(() => {//best available display name for page
	if (name.value?.f2) return name.value.f2
	return userTag.value//fallback to tag if no name set
})

function apply(task) {//update all refs from task - called after any action that returns state
	if (task.otps) {//an array, even an empty one, is current challenge truth, arriving even when the action's answer was no, like a wrong guess or a rate limit
		otps.value = task.otps
		if      (hasText(task.envelopeOtp)) otpCookie.value = task.envelopeOtp//the resealed envelope rides alongside; keep it
		else if (hasText(otpCookie.value))  otpCookie.value = null//nothing live anymore, and we're holding a stale cookie; null here is just how useCookie deletes--the wire protocol is text or blank, and we only touch the cookie if we actually hold one
	}
	if (!task.success) return//taken name, wrong password, paths like those that still aren't toss
	browserHash.value = task.browserHash || ''
	userTag.value = task.userTag || ''
	name.value = task.user || null
	passwordCycles.value = task.passwordCycles || 0
	totpEnrolled.value = task.totpEnrolled || false
	totpIdentifier.value = task.totpIdentifier || ''
	enrollment.value = task.enrollment || null
	wallet.value = task.wallet || ''
	oauths.value = task.oauths || []
	emails.value = task.emails || []
	phones.value = task.phones || []
}

async function load() { if (loaded.value) return; loaded.value = true
	let totpCookie = useTotpCookie()
	let body = {}
	if (hasText(totpCookie.value)) body.envelope = totpCookie.value//in-flight totp enrollment to recover
	if (hasText(otpCookie.value)) body.envelopeOtp = otpCookie.value//found otp envelope cookie; live challenges to recover, ttd january
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

async function walletProve1({address}) {
	let task = await fetchWorker('/credential', 'WalletProve1.', {address})
	apply(task)
	return task
}

async function walletProve2({address, message, signature, envelope}) {
	let task = await fetchWorker('/credential', 'WalletProve2.', {address, message, signature, envelope})
	apply(task)
	return task
}

async function walletRemove() {
	let task = await fetchWorker('/credential', 'WalletRemove.')
	apply(task)
}

async function oauthRemove({provider}) {//unlink a specific provider; provider is one of the tags from oauthProviders() (see .env.keys 'oauth, providers')
	let task = await fetchWorker('/credential', 'OauthRemove.', {provider})
	apply(task)
}

async function otpSend({address, provider, turnstileToken}) {//ask the server to email or text a code; provider is the single letter a or t from the box beside the address
	let task = await fetchWorker('/credential', 'OtpSendTurnstile.', {address, provider, turnstileToken, envelopeOtp: otpCookie.value || undefined})
	apply(task)
	return task
}

async function otpEnter({tag, guess}) {//the person's guess at a code; task.success and task.outcome carry the verdict
	let task = await fetchWorker('/credential', 'OtpEnter.', {tag, guess, envelopeOtp: otpCookie.value || undefined})
	apply(task)
	return task
}

async function emailRemove({f0}) {//remove an email address, proven or pending; f0 is the normalized form from the emails list
	let task = await fetchWorker('/credential', 'EmailRemove.', {f0})
	apply(task)
}

async function phoneRemove({f0}) {//remove a phone number the same way
	let task = await fetchWorker('/credential', 'PhoneRemove.', {f0})
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
	wallet,
	walletProve1,
	walletProve2,
	walletRemove,
	oauths,
	oauthRemove,
	emails, phones, otps,
	otpSend, otpEnter,
	emailRemove, phoneRemove,
	closeAccount,
}

})
















