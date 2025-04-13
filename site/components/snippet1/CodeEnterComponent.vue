<script setup>//./components/CodeEnterComponent.vue

import {
onlyNumerals, Code, sayTimePage,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const props = defineProps({
	code: {type: Object, required: true},
})

const refShow = ref(true)

const refInstruction = ref('')
const refCodeCandidate = ref('')

const refButton = ref(null)
const refButtonCanSubmit = ref(false)
const refButtonInFlight = ref(false)

let method
if      (props.code.addressType == 'Email.') method = 'email'
else if (props.code.addressType == 'Phone.') method = 'phone'
else                                         method = 'messages'
refInstruction.value = `Check your ${method} for the code we sent`

watch([refCodeCandidate], () => {
	refButtonCanSubmit.value = toBoolean(hasText(onlyNumerals(refCodeCandidate.value)))//clickable after even the first number, intentionally
})

async function onClick() {
	let result = await refButton.value.post('/api/code/enter', {
		codeTag: props.code.tag,//hidden from the user but kept with the form
		codeCandidate: onlyNumerals(refCodeCandidate.value),
	})
	log('code enter post result', look(result))
	/*
	response
	.success true - correct guess, watch out for .codes to be [] because satisifying a code challenge also kills it!
	.success false
		.reason Expired.          - next step for the user is to request a new code
		.reason Wrong. .lives 1+  - the user can guess again
		.reason Wrong. .lives 0   - next step for the user is to request a new code
	*/
	if (result.response.success) {
		log('reached 1, correct')//[x] component will disappear
		//message and close, maybe also auto close
	} else if (result.response.reason == 'Wrong.' && result.response.lives) {
		log('reached 2, try again')//[x]
		//box stays open
	} else if (result.response.reason == 'Wrong.' && result.response.lives == 0) {
		log('reached 3, get a new code')//[x]
		//not sure yet, but for right now, message and close
	} else {
		log('SOME OTHER OUTCOME')
	}
	helloStore.setCodes(result.response.codes)
}
function clickedCantFind() {
	log('clicked cant find')
}

</script>
<template>
<div class="border border-gray-300 p-2" v-show="refShow">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>

<p>{{refInstruction}}</p>
<p>
	Code {{code.letter}}
	<input :maxlength="Limit.input"
		type="tel" inputmode="numeric" enterkeyhint="Enter"
		v-model="refCodeCandidate"
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
<p><LinkButton @click="clickedCantFind">I can't find it</LinkButton></p>

</div>
</template>
