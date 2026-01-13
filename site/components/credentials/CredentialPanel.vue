<script setup>

import {
} from 'icarus'

const credentialStore = useCredentialStore()
await credentialStore.load()//runs on server render, then no-op on client due to loaded ref

const refEditing = ref('')//'' | 'account' | 'name' | 'password'
function onCancel() {
	refEditing.value = ''
	refNameOutput.value = ''
	refPasswordOutput.value = ''
}

//account
function onEditAccount() { refEditing.value = 'account' }
async function onSignOut() {
	await credentialStore.signOut()
	refEditing.value = ''
}
async function onCloseAccount() {
	await credentialStore.closeAccount()
	refEditing.value = ''
}

//name
const refChooseName = ref(null)
const refNameOutput = ref('')
function onEditName() {
	refEditing.value = 'name'
	refNameOutput.value = ''
}
async function onRemoveName() {
	await credentialStore.removeName()
	refEditing.value = ''
}
async function onSaveName() {
	if (!refChooseName.value?.valid) return
	refNameOutput.value = 'Saving...'
	let task = await credentialStore.setName({name1: refChooseName.value.name1, name2: refChooseName.value.name2})
	if (task.success) {
		refNameOutput.value = 'Name updated!'
		refEditing.value = ''
	} else if (task.outcome == 'NameNotAvailable.') {
		refNameOutput.value = 'That name is not available.'
	} else {
		refNameOutput.value = `Error: ${task.outcome}`
	}
}

//password
const refPasswordOutput = ref('')
function onEditPassword() {
	refEditing.value = 'password'
	refPasswordOutput.value = ''
}
async function onRemovePassword() {
	await credentialStore.removePassword()
	refEditing.value = ''
}
async function onPasswordDone({currentHash, newHash, newCycles}) {
	refPasswordOutput.value = 'Saving...'
	let task = await credentialStore.setPassword({currentHash, newHash, newCycles})
	if (task.success) {
		refPasswordOutput.value = 'Password updated!'
		refEditing.value = ''
	} else if (task.outcome == 'WrongPassword.') {
		refPasswordOutput.value = 'Current password is incorrect.'
	} else {
		refPasswordOutput.value = `Error: ${task.outcome}`
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialPanel</i></p>

<p>browser hash <code class="break-all">{{credentialStore.browserHash }}</code></p>

<div v-if="credentialStore.userTag">
	<p class="my-space">
		user tag <code>{{credentialStore.userTag}}</code> signed in
		<Button v-show="refEditing !== 'account'" link :click="onEditAccount">Edit</Button>
	</p>
	<p v-if="refEditing === 'account'" class="my-space">
		<Button :click="onSignOut">Sign Out</Button>
		<Button :click="onCloseAccount">Permanently Close Account</Button>
		<Button :click="onCancel">Cancel</Button>
	</p>
</div>
<p v-else>no user is signed in</p>

<div v-if="credentialStore.userTag && credentialStore.name">
	<p class="my-space">
		user has name
		f0 <code>{{credentialStore.name.f0}}</code>,
		f1 <code>{{credentialStore.name.f1}}</code>,
		f2 <code>{{credentialStore.name.f2}}</code>
		<Button v-show="refEditing !== 'name'" link :click="onEditName">Edit</Button>
	</p>
	<template v-if="refEditing === 'name'">
		<ChooseNameFormlet ref="refChooseName" :name2="credentialStore.name.f2" :name1="credentialStore.name.f1" />
		<p class="my-space">
			<Button :click="onSaveName" :state="refChooseName?.valid ? 'ready' : 'ghost'">Change Name</Button>
			<Button :click="onRemoveName">Remove Name</Button>
			<Button :click="onCancel">Cancel</Button>
			{{ refNameOutput }}
		</p>
	</template>
</div>
<div v-if="credentialStore.userTag && !credentialStore.name">
	<p class="my-space">
		user has no name
		<Button v-show="refEditing !== 'name'" link :click="onEditName">Add Name</Button>
	</p>
	<template v-if="refEditing === 'name'">
		<ChooseNameFormlet ref="refChooseName" />
		<p class="my-space">
			<Button :click="onSaveName" :state="refChooseName?.valid ? 'ready' : 'ghost'">Set Name</Button>
			<Button :click="onCancel">Cancel</Button>
			{{ refNameOutput }}
		</p>
	</template>
</div>

<div v-if="credentialStore.userTag && credentialStore.passwordCycles">
	<p class="my-space">
		user has password protected by <code>{{credentialStore.passwordCycles}}</code> cycles
		<Button v-show="refEditing !== 'password'" link :click="onEditPassword">Edit</Button>
	</p>
	<template v-if="refEditing === 'password'">
		<SetPasswordFormlet :cycles="credentialStore.passwordCycles" @done="onPasswordDone">
			<template #actions>
				<Button :click="onRemovePassword">Remove Password</Button>
				<Button :click="onCancel">Cancel</Button>
				{{ refPasswordOutput }}
			</template>
		</SetPasswordFormlet>
	</template>
</div>
<div v-if="credentialStore.userTag && !credentialStore.passwordCycles">
	<p class="my-space">
		user has no password
		<Button v-show="refEditing !== 'password'" link :click="onEditPassword">Add Password</Button>
	</p>
	<template v-if="refEditing === 'password'">
		<SetPasswordFormlet :cycles="0" @done="onPasswordDone">
			<template #actions>
				<Button :click="onCancel">Cancel</Button>
				{{ refPasswordOutput }}
			</template>
		</SetPasswordFormlet>
	</template>
</div>

</div>
</template>
<style scoped>

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
