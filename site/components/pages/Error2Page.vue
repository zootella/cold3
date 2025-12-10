<script setup>//./components/Error2Page.vue

import {
getBrowserGraphics,
} from 'icarus'
const pageStore = usePageStore()

const refButton = ref(null)
const refButtonCanSubmit = ref(toBoolean(pageStore.errorDetails))
//ttd april2025, while error.vue can't report the error or automatically redirect here, you could make this page automatically report the error on load here. the user's click on error.vue would still interrupt an infinite loop

async function onClick() {
	await refButton.value.post('/api/report', {action: 'PageErrorTurnstile.',
		sticker: Sticker(),
		graphics: getBrowserGraphics(),
		details: pageStore.errorDetails,
	})
	pageStore.errorDetails = null
	refButtonCanSubmit.value = false
}

function hardReplace() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

/*
ttd april2025
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
		label="Report Error"
		labelFlying="Reporting..."
		:useTurnstile="true"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		:onClick="onClick"
	/>
</p>
<p><Button @click="hardReplace">Reload Site</Button></p>
</div>

</div>
</template>
