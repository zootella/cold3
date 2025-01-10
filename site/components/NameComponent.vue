<script setup>

import {
log, look, Now, Time,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

let refName = ref('')//form elements the user changes
let refTerms = ref(false)//the user and script can change this one

let refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for post-in-flight

let refTurnstileComponent = ref(null)
let refGettingToken = ref(false)//true while we've called turnstile execute and it's getting a token for us
let refToken = ref('')

let refGettingResponse = ref(false)//true while our POST to our own api endpoint is in flight
let refResponse = ref('')

watch([refName, refTerms, refGettingToken, refToken, refGettingResponse, refResponse], () => {

	let filled = refName.value.length && refTerms.value//true if the form is filled out to be submittable

	if (refGettingResponse.value) {//post in flight
		refButtonState.value = 'orange'
	} else if (filled && refToken.value.length) {//form and token all ready
		refButtonState.value = 'green'
	} else {
		refButtonState.value = 'gray'
	}

	if (refButtonState.value == 'gray' && filled && !refGettingToken.value) {
		/*no await*/getToken()
	}
})

async function getToken() {//gets called when form data is submittable
	try {
		log('get token start')
		refGettingToken.value = true

		refToken.value = await refTurnstileComponent.value.turnstileExecute()

	} catch (e) {
		log('get token caught', look({e}))
		refTerms.value = false//uncheck the box so user action will try again (otherwise causes infinite loop of token execution!)
		refToken.value = ''//shouldn't have been able to set anything but just in case
	} finally {
		refGettingToken.value = false
		log('get token end')
	}
}

async function getResponse() {//gets called when the user clicks the button
	try {
		log('get response start')
		refGettingResponse.value = true

		let body = {name: refName.value, terms: refTerms.value, turnstileToken: refToken.value}
		refTerms.value = false//uncheck the box for next time
		refToken.value = ''//blank the token to use it only once
		refResponse.value = await $fetch('/api/name', {method: 'POST', body})

	} catch (e) {
		log('get response caught', {e})
	} finally {
		refGettingResponse.value = false
		log('get response end')
	}
}

function clickedSnippet() {
	log(look({
		refName: refName.value,
		refTerms: refTerms.value,
		refGettingToken: refGettingToken.value,
		refToken: refToken.value,
		refGettingResponse: refGettingResponse.value,
		refResponse: refResponse.value,
	}))
}

</script>
<template>
<div>

<p>Check if your desired username is available.</p>
<p>Name: <input type="text" v-model="refName" /></p>
<div>our new turnstile component: <TurnstileComponent ref="refTurnstileComponent" /></div>
<p>
	<label><input type="checkbox" v-model="refTerms" />Accept Terms</label>
	<button :disabled="refButtonState != 'green'" :class="refButtonState" @click="getResponse">Check</button>
</p>
<p>Response: <i>{{ refResponse }}</i></p>

<!-- <p><button @click="clickedSnippet">Snippet</button></p> -->

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>








































