<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

const helloStore = useHelloStore()

let refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for POST-in-flight

const refPhone = ref('')
const refOutput = ref('')

let refInFlight = ref(false)//true while we're getting a token and POSTing to our own api, both of those combined

watch([refPhone], () => {
	let v = validatePhone(refPhone.value)
	refOutput.value = v

	if (refInFlight.value) {//turnstile or post in flight
		refButtonState.value = 'orange'
	} else if (v.valid) {//form ready to submit
		refButtonState.value = 'green'
	} else {
		refButtonState.value = 'gray'
	}
})

/*
1 send a sms (don't deploy)
2 put in limits (code dies in 20min, 4 tries, replacement issuance; address limited to 10 messages in 24h or 20h cooldown; )
3 record in address_table (user enters address, which is Challenged. Proven. Removed.)
4 generate or tie to user tag, user tag is generated on first address submission
*/

async function clickedSend() {
	refOutput.value = validatePhone(refPhone.value)
}


/*
ttd february
stuff to do at this level generally
[]how do you say on the page that this text box cannot hold more than 2k characters or some sanity maximum; do that for every box on every page, essentially
[]tel and numeric is cool, test it out--you can rename the send button, but can you gray it out? if not maybe don't have one

	<form @submit.prevent="clickedSend">
		<input
			type="tel"
			inputmode="numeric"
			enterkeyhint="Send Code"
		/>
		<!-- You can have a visible submit button or not -->
		<button type="submit" class="hidden">Send Code</button>

*/


</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeComponent</i></p>

<p><code>{{helloStore.browserTag}}</code> browser tag</p>
<p><code>{{helloStore.userTag}}</code> user tag</p>

<p>
	<input
		type="tel" inputmode="numeric"
		v-model="refPhone" placeholder="sms number"
		class="w-96"
	/>{{' '}}
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		@click="clickedSend"
		class="pushy"
	>Send Code</button>
</p>

<pre>{{refOutput}}</pre>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
