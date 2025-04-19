<script setup>

import {
getBrowserGraphics,
} from 'icarus'
const errorStore = useErrorStore()

definePageMeta({layout: 'feed-layout', note: 'on error2'})
//ttd april, you probably won't use feed layout for this error reporting page

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)
//ttd april, right now  you're just using a post button with turnstile to let the user report the error; you could change this to report automatically on page load

if (errorStore.errors.length) refButtonCanSubmit.value = true

async function onClick() {
	await refButton.value.post('/api/error', {
		sticker: Sticker().all,
		errors: errorStore.errors,//here, we *don't* dereference .value!
		graphics: getBrowserGraphics(),
	})
	errorStore.clear()
	refButtonCanSubmit.value = false//don't allow a duplicate submission
	//oh actually maybe you clear the error, and if the user refreshes this page without an error, or navigates to this page without an error, you redirect to home
}

</script>
<template>
<div class="page-container text-center">

<p>An unexpected error in the page meant we couldn't do that right now.</p>
<p>Click the button below to report this error to staff.</p>
<p>Refresh the page to try again.</p>
<p>Chat with us in Discord to let us know what's going on!</p>
<p>we have {{errorStore.errors.length}} errors you could report right now</p>
<PostButton
	labelIdle="Report Error"
	labelFlying="Reporting..."
	:useTurnstile="true"

	ref="refButton"
	:canSubmit="refButtonCanSubmit"
	v-model:inFlight="refButtonInFlight"
	:onClick="onClick"
/>

</div>
</template>
