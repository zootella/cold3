<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

const helloStore = useHelloStore()

const refAddress = ref('')
const refOutput = ref('')

/*
1 send a sms (don't deploy)
2 put in limits (code dies in 20min, 4 tries, replacement issuance; address limited to 10 messages in 24h or 20h cooldown; )
3 record in address_table (user enters address, which is Challenged. Proven. Removed.)
4 generate or tie to user tag, user tag is generated on first address submission
*/

async function clickedSend() {
	refOutput.value = validatePhone(refAddress.value)
}


</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>AddressComponent</i></p>

<p><code>{{helloStore.browserTag}}</code> browser tag</p>
<p><code>{{helloStore.userTag}}</code> user tag</p>

<p>
	<input
		type="tel" inputmode="numeric" pattern="[0-9]*"
		v-model="refAddress" placeholder="sms number"
		class="w-96"
	/>{{' '}}
	<button @click="clickedSend()" class="pushy">Send Code</button>
</p>

<pre>{{refOutput}}</pre>


</div>
</template>
