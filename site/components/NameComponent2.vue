<script setup>

import {
log, look, Now, Time, Limit, validateName,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

let refName = ref('')
let refNameValidStatus = ref('')

let refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for post-in-flight

let refInFlight = ref(false)//true while we're getting a token and POSTing to our own api, both of those combined
let refResponse = ref('')

watch([refName, refInFlight, refResponse], () => {
	/*
	so here we are in namecomponent2, which we can refactor to:
	1[x]determine if the name is valid to submit, that we can do right here
	2[x]actually check the name, that's in the endpoint
	3[x]remove turnstile from namecomponent2; you can always refer back to namecomponent1, confirm name availability still works
	4[]refactor to use PostButton, removing our use of turnstile
	5[]write and use TurnstileButton, following the turnstile implementation in NameComponent1.vue, read-only

	hide the turnstile widget, and have the texton the page say how long turnstile took to finish and how long the post took, those two, separately
	*/

	let v = validateName(refName.value, Limit.name)
	if (v.isValid) refNameValidStatus.value = `will check "${v.formNormal}" Normal; "${v.formFormal}" Formal; "${v.formPage}" Page`
	else refNameValidStatus.value = 'name not valid to check'

	if (refInFlight.value) {//post in flight
		refButtonState.value = 'orange'
	} else if (v.isValid) {//form ready to submit
		refButtonState.value = 'green'
	} else {
		refButtonState.value = 'gray'
	}
})

async function clickedCheck() {//gets called when the user clicks the button
	try {
		log('clicked submit start')
		refInFlight.value = true

		let t1 = Now()
		let t2 = Now()
		let body = {name: refName.value, turnstileToken: ''}
		refResponse.value = await $fetch('/api/name', {method: 'POST', body})
		log(look(refResponse.value))
		let t3 = Now()
		log(`button was orange for turnstile's ${t2-t1}ms and then fetch's ${t3-t2}ms`)

	} catch (e) {
		log('clicked submit caught', look(e))
	} finally {
		refInFlight.value = false
		log('clicked submit end')
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NameComponent2</i></p>

<p>Check if your desired username is available. Uses Turnstile, when deployed.</p>
<div>
	<input
		:maxlength="Limit.input"
		type="text"
		v-model="refName"
		placeholder="desired user name or route"
		class="w-72"
	/>
	{{' '}}
	<button :disabled="refButtonState != 'green'" :class="refButtonState" @click="clickedCheck" class="pushy">Check</button>
</div>
<p>{{refNameValidStatus}}</p>
<div><pre>{{refResponse}}</pre></div>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>


































