<script setup>//./components/Error2Page.vue

import {
getBrowserGraphics,
} from 'icarus'
const errorStore = useErrorStore()

const refButton = ref(null)
const refButtonCanSubmit = ref(toBoolean(errorStore.errors.length))
const refButtonInFlight = ref(false)
//ttd april, right now this page just has a post button with turnstile to let the user report the error; you could change this to report automatically on page load

async function onClick() {
	await refButton.value.post('/api/error', {
		sticker: Sticker().all,
		errors: errorStore.errors,//here, we *don't* dereference .value!
		graphics: getBrowserGraphics(),
	})
	errorStore.clear()
	refButtonCanSubmit.value = false
}

function rootReload() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

</script>
<template>
<div class="page-container text-center">

<p>error2</p>
<p>
	<PostButton
		labelIdle="Report Error"
		labelFlying="Reporting..."
		:useTurnstile="true"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClick="onClick"
	/>
</p>
<p><Button @click="rootReload">Reload Site</Button></p>

</div>
</template>
