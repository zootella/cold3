<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
onlyNumerals, Code, hashToLetter,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

//ttd march, really, this should be at the top of every page, and render into a list of catch boxes for 0+ codes alive
const refCodeTag = ref('c2kK42lIV2MThI1VHsTGf')//you need to get this from hello store 2, probably?
const refLetter = ref('H')//and then you need to hash it down to this with hashToLetter(c.codeTag, Code.alphabet)
const refInstruction = ref('example instruction')
const refCode = ref('')
const refOutput = ref('example output')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

watch([refCode], () => {
	refButtonCanSubmit.value = hasText(onlyNumerals(refCode.value))//clickable after even the first number, intentionally
})

async function onClick() {
	let response = await refButton.value.post('/api/code/enter', {
		codeTag: refCodeTag.value,//hidden from the user but kept with the form
		codeEntered: onlyNumerals(refCode.value),
	})
	log(look(response))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>

<p>{{refInstruction}}</p>
<p>
	Code {{refLetter}}
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Enter"
		v-model="refCode"
		class="w-32"
	/>{{' '}}
	<PostButton
		labelIdle="Enter"
		labelFlying="Verifying..."
		:useTurnstile="false"

		ref="refButton"
		:canSubmit="refButtonCanSubmit"
		v-model:inFlight="refButtonInFlight"
		:onClick="onClick"
	/>
</p>
<p>{{refOutput}}</p>

</div>
</template>
