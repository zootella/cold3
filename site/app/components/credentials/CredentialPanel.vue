<script setup>
/*
CredentialPanel.vue - credential management for signed-in users

Shows: account controls (sign out, close account), name editor, password editor, TOTP enrollment, wallet, oauth, email, phone
Modes: an `open` object of per-section booleans; each section expands and collapses on its own, so several can be open at once. That's deliberate for now — while we smoke test we want every box reachable at a glance and a click, not one-at-a-time. A later sprint may streamline the controls around likely flows and reintroduce some coupling.
Parent: just render <CredentialPanel />, no props needed; assumes user is signed in
Server contact: loads credentialStore, calls store methods for sign out, name changes, password changes
Nested: uses ChooseNameForm for name editing, SetPasswordForm for password editing, TotpPanel for TOTP
*/

import {
} from 'icarus'

const credentialStore = useCredentialStore()
await credentialStore.load()//runs on server render, then no-op on client due to loaded ref

const open = reactive({account: false, name: false, password: false, totp: false, wallet: false, oauth: false, email: false, phone: false})//each section opens and closes independently
function onCancel(section) {//collapse one section, leaving the others as they are
	open[section] = false
	if (section == 'name') refNameOutput.value = ''
	else if (section == 'password') refPasswordOutput.value = ''
}

//account
function onEditAccount() { open.account = true }
async function onSignOut() {
	await credentialStore.signOut()
	open.account = false
}
async function onCloseAccount() {
	await credentialStore.closeAccount()
	open.account = false
}

//name
const refChooseName = ref(null)
const refNameOutput = ref('')
function onEditName() {
	open.name = true
	refNameOutput.value = ''
}
async function onRemoveName() {
	await credentialStore.removeName()
	open.name = false
}
async function onSaveName() {
	if (!refChooseName.value?.valid) return
	refNameOutput.value = 'Saving...'
	let task = await credentialStore.setName({name1: refChooseName.value.name1, name2: refChooseName.value.name2})
	if (task.success) {
		refNameOutput.value = 'Name updated!'
		open.name = false
	} else if (task.outcome == 'NameNotAvailable.') {
		refNameOutput.value = 'That name is not available.'
	} else {
		refNameOutput.value = `Error: ${task.outcome}`
	}
}

//password
const refPasswordOutput = ref('')
function onEditPassword() {
	open.password = true
	refPasswordOutput.value = ''
}
async function onRemovePassword() {
	await credentialStore.removePassword()
	open.password = false
}
async function onPasswordDone({currentHash, newHash, newCycles}) {
	refPasswordOutput.value = 'Saving...'
	let task = await credentialStore.setPassword({currentHash, newHash, newCycles})
	if (task.success) {
		refPasswordOutput.value = 'Password updated!'
		open.password = false
	} else if (task.outcome == 'WrongPassword.') {
		refPasswordOutput.value = 'Current password is incorrect.'
	} else {
		refPasswordOutput.value = `Error: ${task.outcome}`
	}
}

</script>
<template>
<Box>
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialPanel</i></p>

<p>browser hash <code class="break-all">{{credentialStore.browserHash }}</code></p>

<div class="space-y-2"><!-- every credential section is the same bordered box, spaced uniformly, so the parts read at a glance -->

<Box v-if="credentialStore.userTag">
	<p class="my-space">
		user tag <code>{{credentialStore.userTag}}</code> signed in
		<Button v-show="!open.account" link :click="onEditAccount">Edit</Button>
	</p>
	<p v-if="open.account" class="my-space">
		<Button :click="onSignOut">Sign Out</Button>
		<Button :click="onCloseAccount">Permanently Close Account</Button>
		<Button :click="() => onCancel('account')">Cancel</Button>
	</p>
</Box>
<p v-else>no user is signed in</p>

<Box v-if="credentialStore.userTag && credentialStore.name">
	<p class="my-space">
		user has name
		f0 <code>{{credentialStore.name.f0}}</code>,
		f1 <code>{{credentialStore.name.f1}}</code>,
		f2 <code>{{credentialStore.name.f2}}</code>
		<Button v-show="!open.name" link :click="onEditName">Edit</Button>
	</p>
	<template v-if="open.name">
		<ChooseNameForm ref="refChooseName" :name2="credentialStore.name.f2" :name1="credentialStore.name.f1" />
		<p class="my-space">
			<Button :click="onSaveName" :state="refChooseName?.valid ? 'ready' : 'ghost'">Change Name</Button>
			<Button :click="onRemoveName">Remove Name</Button>
			<Button :click="() => onCancel('name')">Cancel</Button>
			{{ refNameOutput }}
		</p>
	</template>
</Box>
<Box v-if="credentialStore.userTag && !credentialStore.name">
	<p class="my-space">
		user has no name
		<Button v-show="!open.name" link :click="onEditName">Add Name</Button>
	</p>
	<template v-if="open.name">
		<ChooseNameForm ref="refChooseName" />
		<p class="my-space">
			<Button :click="onSaveName" :state="refChooseName?.valid ? 'ready' : 'ghost'">Set Name</Button>
			<Button :click="() => onCancel('name')">Cancel</Button>
			{{ refNameOutput }}
		</p>
	</template>
</Box>

<Box v-if="credentialStore.userTag && credentialStore.passwordCycles">
	<p class="my-space">
		user has password protected by <code>{{credentialStore.passwordCycles}}</code> cycles
		<Button v-show="!open.password" link :click="onEditPassword">Edit</Button>
	</p>
	<template v-if="open.password">
		<SetPasswordForm :cycles="credentialStore.passwordCycles" @done="onPasswordDone">
			<template #actions>
				<Button :click="onRemovePassword">Remove Password</Button>
				<Button :click="() => onCancel('password')">Cancel</Button>
				{{ refPasswordOutput }}
			</template>
		</SetPasswordForm>
	</template>
</Box>
<Box v-if="credentialStore.userTag && !credentialStore.passwordCycles">
	<p class="my-space">
		user has no password
		<Button v-show="!open.password" link :click="onEditPassword">Add Password</Button>
	</p>
	<template v-if="open.password">
		<SetPasswordForm :cycles="0" @done="onPasswordDone">
			<template #actions>
				<Button :click="() => onCancel('password')">Cancel</Button>
				{{ refPasswordOutput }}
			</template>
		</SetPasswordForm>
	</template>
</Box>

<TotpPanel
	v-if="credentialStore.userTag"
	:editing="open.totp"
	@edit="open.totp = true"
	@cancel="() => onCancel('totp')"
/>

<WalletPanel
	v-if="credentialStore.userTag"
	:editing="open.wallet"
	@edit="open.wallet = true"
	@cancel="() => onCancel('wallet')"
/>

<OauthPanel
	v-if="credentialStore.userTag"
	:editing="open.oauth"
	@edit="open.oauth = true"
	@cancel="() => onCancel('oauth')"
/>

<EmailPanel
	v-if="credentialStore.userTag"
	:editing="open.email"
	@edit="open.email = true"
	@cancel="() => onCancel('email')"
/>

<PhonePanel
	v-if="credentialStore.userTag"
	:editing="open.phone"
	@edit="open.phone = true"
	@cancel="() => onCancel('phone')"
/>

</div>

</Box>
</template>
<style scoped>
@reference "tailwindcss";

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
