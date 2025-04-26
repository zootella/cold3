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
	await refButton.value.post('/api/report', {action: 'PageErrorTurnstile.',
		sticker: Sticker().all,
		graphics: getBrowserGraphics(),
		details: makePlain(errorStore.details),//ttd april, this pattern here is weird, instead, have fetchWorker use makePlain on the whole body, so you don't have to duplicate details, or mess with them specifically
		detailsText: look(errorStore.details),//call look here on the page; fetch will stringify details.error to empty {}
		//ttd april, now that you're using makePlain you shouldn't need detailsText
	})
	errorStore.details = null
	refButtonCanSubmit.value = false
}

function rootReload() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

/*
ttd april
the user may drag down to refresh on this page--at that point they will have navigated to a new copy of this page that doesn't have an error to report
so, important to add
[]if here with nothing to report, do rootReload automatically
[]if here with something to report, do turnstile and POST, then rootReload, all automated
you can automate those two without worry about an infinite loop, as
an error leads to error.vue
and there, only the user's manual click moves things forward
*/

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
