<script setup>

import {
log, look, Now, Limit, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
validatePhone,
onlyNumerals, Code, hashToLetter,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const props = defineProps({
	code: {type: Object, required: true},
})

//ttd march, really, this should be at the top of every page, and render into a list of catch boxes for 0+ codes alive
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
		codeTag: props.code.codeTag,//hidden from the user but kept with the form
		codeEntered: onlyNumerals(refCode.value),
	})
	log(look(response))
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>

<pre>{{code}}</pre>
<p>code tag: <code>{{code.codeTag}}</code></p>

<p>{{refInstruction}}</p>
<p>
	Code {{code.letter}}
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
