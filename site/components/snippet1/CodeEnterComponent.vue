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
	let r = await refButton.value.post('/api/code/enter', {
		codeTag: props.code.tag,//hidden from the user but kept with the form
		codeCandidate: onlyNumerals(refCodeCandidate.value),
	})
	log("CodeEnterComponent's onClick got this r from the post:", look(r))
	helloStore.codesMerge(r.response.codes)

	/*
	can't find it
	- just sent it, so wait
	- sent a minute ago, so actually check
	- sent two minutes ago, and can

	_i cant find it_

	>just sent
	wait
	>sent a minute ago
	actually check



	*/

	/*
	if the code the user has been working on expired or was guessed to death, you'll get no code records at all, merge in []
	and success false, guessAgain false

	what really does CodeEnterComponent do?
	it's there because the page knows this browser has a code the user could find and enter
	it's tied to a specific code challenge, it has the code tag and prefix letter

	what's the minimal ui copy here?

	Check your email|texts for the code we sent
	*/


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
function clickedCantFind() {
	log('clicked cant find')
}

/*
<p>
	we sent the code at {{sayTimePage(code.tick)}} and it'll last for {{Code.lifespan20/Time.minute}} minutes from then,
	until {{sayTimePage(code.tick + (20*Time.minute))}}. After that, you'll have to request a new one.
</p>
*/

</script>
<template>
<div class="border border-gray-300 p-2" v-show="refShow">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CodeEnterComponent</i></p>


<pre>{{code}}</pre>

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




































