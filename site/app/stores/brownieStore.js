//the brownie: one localStorage entry per user, holding a single sealed envelope of in-flight credential state
//standalone and client-only in the wagmiStore shape--this store is the only place our code uses localStorage
//first resident: totp enrollment state, moved in from the old temporary_envelope_totp cookie

import {
hashText,
} from 'icarus'

export const useBrownieStore = defineStore('brownieStore', () => {

/*
A brownie is one localStorage entry per user, holding a single sealed envelope of that user's in-flight credential
state. cold3 has no session object--the worker in the middle holds nothing between requests--and the brownie is the
one deliberate cheat in that direction: state that belongs to a person at a browser, parked on the page, opaque to
the page. Only the server can create or read the envelope, and the brownie is not a sign-in--the httpOnly browserTag
cookie remains the only session credential, and the server refuses a brownie whose sealed owner isn't the signed-in
user. The items inside are self-describing, so future tenants beyond credentials, like sudo elevation, move in as
new item types without changing this store.

The key is three parts joined by dots:

brownie.DWFWM4UEAFDLYRFAYI42YLEO7ZONVOT36AJM7TAKOY5BSN3HE3OQ.1784764575418

"brownie." marks the entry as ours among whatever else scripts and extensions park at this origin. The middle part
is hashText(userTag), and per-user keying is what keeps two people who share one browser profile from crossing or
colliding: Alice signs out mid-flow, Bob signs in and runs his own flow, and each one's brownie waits under its own
key--sign-out deletes nothing, and only a malicious act, never mere chaotic use, could post one user's brownie from
the other's session. The tag is hashed rather than plaintext for those same housemates: sharing a profile shouldn't
mean learning each other's userTags out of devtools. The last part is the epoch tick of the overall shelf life,
mirrored out from the expiration sealed inside.

Each user has at most one brownie at a time: a POST sends the current brownie if one is held, the server replies
with a new one, and we replace the previous with the new, always--so the only way a browser holds several is
several users sharing one profile, each mid-flow. The shelf life we enforce right here on the page: an expired
brownie is deleted on sight, at spa start for any user and at read for our own, never sent up just so the server
can discover that everything inside has expired. The server still enforces the expirations sealed inside, so a
tampered epoch changes nothing about security.

There's deliberately no state in this store--no reactive ref wraps the ciphertext; callers read fresh at each use.
*/

function mounted() {//called once per spa from app.vue's onMounted; enforce shelf life across the whole namespace, any user's entries
	if (import.meta.server) return//the server has no localStorage
	let keys = []
	for (let i = 0; i < localStorage.length; i++) {//snapshot before acting; removal renumbers the browser's key indices
		let key = localStorage.key(i)
		if (key.startsWith('brownie.')) keys.push(key)
	}
	let now = Now()
	let kept = 0, malformed = 0, expired = 0
	for (let key of keys) {
		let parts = key.split('.')//['brownie', hash of userTag, epoch of shelf life]
		let epoch = 0
		if (parts.length == 3 && hasText(parts[1])) { try { epoch = textToInt(parts[2], 1) } catch (e) {} }//textToInt takes only a canonical positive integer, so junk stays 0; the catch is load-bearing here because these keys are untrusted
		if (!epoch) { localStorage.removeItem(key); malformed++ }//junk in our namespace is ours to delete; localStorage is page territory where old versions of us, other scripts, and extensions leave things
		else if (epoch <= now) { localStorage.removeItem(key); expired++ }//past its shelf life, deleted right away; this also cleans up after every user who has shared this browser profile
		else kept++
	}
	log(`🍫 brownie sweep: kept ${kept}; removed ${expired} expired, ${malformed} malformed`)
}

async function getBrownie({userTag}) {//the sealed ciphertext this user is holding, or blank for nothing--text or blank, matching the wire protocol
	if (import.meta.server) return ''//the server has no localStorage
	let prefix = `brownie.${await hashText(userTag)}.`
	let keys = []
	for (let i = 0; i < localStorage.length; i++) {
		let key = localStorage.key(i)
		if (key.startsWith(prefix)) keys.push(key)
	}
	if (keys.length != 1) {//zero is the common case, no brownie held; several means the one-per-user invariant broke, so wipe rather than guess which is current
		for (let key of keys) localStorage.removeItem(key)
		return ''
	}
	let epoch = 0; try { epoch = textToInt(keys[0].slice(prefix.length), 1) } catch (e) {}//the epoch after the second dot; junk stays 0
	if (!epoch || epoch <= Now()) { localStorage.removeItem(keys[0]); return '' }//expired or malformed, deleted right away rather than sent up for the server to discover everything inside has expired
	return localStorage.getItem(keys[0]) || ''
}

async function setBrownie({userTag, envelope, expiration}) {//apply a response's task.brownie and task.brownieExpiration: text replaces what's stored, blank deletes it
	if (import.meta.server) return//the server has no localStorage
	let prefix = `brownie.${await hashText(userTag)}.`
	let keys = []
	for (let i = 0; i < localStorage.length; i++) {
		let key = localStorage.key(i)
		if (key.startsWith(prefix)) keys.push(key)
	}
	if (hasText(envelope)) {
		let key = prefix + expiration//the epoch is the key's last part, so a reseal that moves the deadline arrives under a new name
		localStorage.setItem(key, envelope)//write the replacement first,
		for (let k of keys) if (k != key) localStorage.removeItem(k)//then remove what it replaces--the new brownie replaces the previous one, always, keeping one per user
	} else {
		for (let k of keys) localStorage.removeItem(k)//blank is the delete command; there is no separate one
	}
}

return {
	mounted,//app.vue calls once per spa for startup hygiene
	getBrownie, setBrownie,//credentialStore sends the ciphertext up with totp bodies and applies what responses carry back
}

})
