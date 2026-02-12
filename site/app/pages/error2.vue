<script setup> definePageMeta({layout: false})//search tag: errorfile

import {
getBrowserGraphics,
} from 'icarus'
const pageStore = usePageStore()

/*
as it has to be really simple, error.vue can't report the error, or even automatically redirect here. But the user's click from there to here has this page automatically report the error on mounted. If there's another error, then the user is back on error.vue, able to loop again or choose Reload to interrupt an infinite loop
*/

const details = pageStore.errorDetails//take the error details from the store into a local variable,
pageStore.errorDetails = null//and clear the store. This way, if the report attempt itself throws, errorPlugin's guard (if pageStore.errorDetails) won't block the new error, it will see errorDetails is null and process it normally, sending the user back to error.vue

const refButton = ref(null)//using Button to get turnstile for free, but display none hides it in the template

onMounted(async () => {
	if (details) {
		await refButton.value.post('/api/report', {//auto-trigger: Button handles turnstile, doing state, and shows "Reporting..."
			action: 'PageErrorTurnstile.',
			sticker: Sticker(),
			graphics: getBrowserGraphics(),
			details: details,
		})
	}
	hardReplace()//if here with nothing to report, bounce home immediately; or, after successful report, go home
})

function hardReplace() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

</script>
<template>
<div class="page-container text-center space-y-2">

<p>Something went wrong. Sorry about that.</p>

<p>Reporting error...</p><!-- intentionally matching error.vue; the user will see the "Report Error" button change to "Reporting error..." text here, with the same controls above and below-->

<p><Button :click="hardReplace">Reload Site</Button></p>

<Button v-show="false" ref="refButton" :useTurnstile="true" /><!-- using Button to get easy turnstile and post; gets rendered into the dom but with css display none, won't affect flow -->

</div>
</template>
