<script setup>//./components/CodeEnterComponent.vue

import {
onlyNumerals, Code, sayTimePage,
} from 'icarus'
const mainStore = useMainStore()
const pageStore = usePageStore()

const props = defineProps({
	code: {type: Object, required: true},
})

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
	let response = await refButton.value.post('/api/code/enter', {
		codeTag: props.code.tag,//hidden from the user but kept with the form
		codeCandidate: onlyNumerals(refCodeCandidate.value),
	})
	log('code enter post response', look(response))
	if (response.success) {
		//automatically, this box will disappear on setCodes below
		pageStore.addNotification("✔️ address verified")
	} else if (response.reason == 'Wrong.' && response.lives) {
		//automatically, nothing changes
		//-[]box should indicate incorrect guess, clear the field, tell the user to try again
	} else if (response.reason == 'Wrong.' && response.lives == 0) {
		//automatically, this box will disappear on setCodes below
		pageStore.addNotification('code incorrect; request a new code to try again')
	} else if (response.reason == 'Expired.') {
		//automatically, this box will disappear on setCodes below
		pageStore.addNotification('code expired; request a new code to try again')
	}
	mainStore.codes = response.codes
}
function clickedCantFind() {
	log('clicked cant find')
}

</script>
<template>
<div class="border border-gray-300 p-2">
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
