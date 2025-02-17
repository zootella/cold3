<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const refPhone = ref('')
const refOutput = ref('')
const refInFlight = ref(false)//true while we're getting a token and POSTing to our own api, both of those combined
const refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for POST-in-flight

watch([refPhone], () => {
	let v = validatePhone(refPhone.value)
	refOutput.value = v

	if (refInFlight.value) { refButtonState.value = 'orange' }
	else if (v.valid) { refButtonState.value = 'green' }
	else { refButtonState.value = 'gray' }
})

/*
1 send a sms (don't deploy) or do but they also have to be signed in using the old system? weird but maybe. or, it doesn't actually send deployed until you remove that, which can be soon
2 put in limits (code dies in 20min, 4 tries, or sent replacement; two codes rigth away fine; then 5min apart; address limited to 10 messages in 24h or 20h cooldown; )
3 record in address_table (user enters address, which is Challenged. Proven. Removed.)
4 generate or tie to user tag, user tag is generated on first address submission so you always have browser tag and user tag
*/

async function clickedSend() {
	//ttd february - doing this right here now but pretty sure it should be in a store? or at least protected with try catch??

	let r = await $fetch('/api/code', {
		method: 'POST',
		body: {
			action: 'Send.',
			browserTag: helloStore.browserTag,
			phone: refPhone.value,
		}
	})
	log(look(r))
	//bookmark february, get those to the backend!
}


</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeComponent</i></p>

<p><code>{{helloStore.browserTag}}</code> browser tag</p>
<p><code>{{helloStore.userTag}}</code> user tag</p>

<p>
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Send Code"
		v-model="refPhone" placeholder="sms number"
		class="w-96"
	/>{{' '}}
	<!-- ttd february, enterkeyhint showing up on iphone keyboard, maybe because you're using and changing :disabled. so you could try to fix that, mostly out of curiosity, or not use it at all, to direct the user's attention back to the page, which is probably what you want to do for usability and consistancy. no, it's because you haven't done the enclosing form with submit prevent yet -->
	<button
		:disabled="refButtonState != 'green'"
		:class="refButtonState"
		@click="clickedSend"
		class="pushy"
	>Send Code</button>
	<!-- how does :class and class together work?! -->
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
