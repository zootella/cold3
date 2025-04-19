<script setup>//./components/Error2Page.vue

import {
getBrowserGraphics,
} from 'icarus'
const errorStore = useErrorStore()

const refButton = ref(null)
const refButtonCanSubmit = ref(toBoolean(errorStore.details))
const refButtonInFlight = ref(false)
//ttd april, while error.vue can't report the error or automatically redirect here, you could make this page automatically report the error on load here. the user's click on error.vue would still interrupt an infinite loop

async function onClick() {
	await refButton.value.post('/api/error', {
		sticker: Sticker().all,
		graphics: getBrowserGraphics(),
		details: errorStore.details,
		detailsText: look(errorStore.details),//call look here on the page; fetch will stringify details.error to empty {}
	})
	errorStore.details = null
	refButtonCanSubmit.value = false
}

function rootReload() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>Error2Page</i></p>

<div class="flex flex-col items-center space-y-2">
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

</div>
</template>
