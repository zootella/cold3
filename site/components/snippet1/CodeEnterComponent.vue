<script setup>//./components/CodeEnterComponent.vue

import {
Data, getBrowserTag,
validatePhone,
onlyNumerals, Code, hashToLetter, sayTimePage,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
const helloStore = useHelloStore()

const props = defineProps({
	code: {type: Object, required: true},
})

const refShow = ref(true)

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
	let result = await refButton.value.post('/api/code/enter', {
		codeTag: props.code.codeTag,//hidden from the user but kept with the form
		codeEntered: onlyNumerals(refCode.value),
	})
	log(look(result))
	props.code.correct = result.response.didEnter.correct
	props.code.lives = result.response.didEnter.lives

	log('server tick', result.tick)
	/*
	response will be correct: true, false
	and lives: 0, 1+
	you can also tell if they guessed this code already, with lives < Code.guesses or whatever

	on correct, just say thanks, and disappear in a few seconds or a click
	on wrong, still lives, say wrong, let them try again

	on wrong, no more lives, say wrong, tell them to request a new code

	and update the pinia store accordingly, removing dead codes from the array? no, setting lives and correct, and then letting this render appropriately!
	*/
}

function buzzer() {
	log('got the buzzer')
}

</script>
<template>
<div class="border border-gray-300 p-2" v-show="refShow">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>

<p>
	we sent the code at {{sayTimePage(code.tick)}} and it'll last for {{Code.lifespan20/Time.minute}} minutes from then,
	until {{sayTimePage(code.tick + (20*Time.minute))}}. After that, you'll have to request a new one.
</p>

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
